import { useReducer, useCallback } from "react";
import { createAnalysisStream } from "../services/api.js";
import { FALLBACK_INCIDENTS } from "../constants/fallback.js";

const AGENTS = ["triage", "threat_intel", "investigation", "playbook", "exec_summary"];

const AGENT_LABELS = {
  triage:        "Triage Agent",
  threat_intel:  "Threat Intel Agent",
  investigation: "Investigation Agent",
  playbook:      "Playbook Agent",
  exec_summary:  "Executive Summary Agent",
};

const initialAgents = AGENTS.map((key) => ({
  key,
  label: AGENT_LABELS[key],
  status: "waiting",
  message: "",
}));

const initialState = {
  status: "idle",
  agentResults: initialAgents,
  incidents: [],
  activeAlertIds: [],
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "START":
      return {
        ...initialState,
        status: "running",
        agentResults: initialAgents,
      };

    case "AGENT_START":
      return {
        ...state,
        agentResults: state.agentResults.map((a) =>
          a.key === action.agent ? { ...a, status: "running", message: action.message } : a
        ),
      };

    case "AGENT_DONE":
      return {
        ...state,
        agentResults: state.agentResults.map((a) =>
          a.key === action.agent ? { ...a, status: "done", message: action.message } : a
        ),
      };

    case "PIPELINE_DONE":
      return {
        ...state,
        status: "done",
        incidents: action.incidents,
        activeAlertIds: action.incidents.flatMap((i) => i.alert_ids || []),
      };

    case "ERROR":
      return {
        ...state,
        status: "error",
        error: action.message,
        incidents: FALLBACK_INCIDENTS,
        activeAlertIds: FALLBACK_INCIDENTS.flatMap((i) => i.alert_ids || []),
        agentResults: state.agentResults.map((a) =>
          a.status === "running" ? { ...a, status: "error", message: action.message } : a
        ),
      };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

export function useAnalysis() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const startAnalysis = useCallback((alerts) => {
    dispatch({ type: "START" });

    const stream = createAnalysisStream(alerts);

    stream.start(
      (event) => {
        if (event.type === "agent_start") {
          dispatch({ type: "AGENT_START", agent: event.agent, message: event.message });
        } else if (event.type === "agent_done") {
          dispatch({ type: "AGENT_DONE", agent: event.agent, message: event.message });
        } else if (event.type === "error") {
          dispatch({ type: "ERROR", message: event.message });
        }
      },
      (err) => dispatch({ type: "ERROR", message: err.message }),
      (event) => dispatch({ type: "PIPELINE_DONE", incidents: event.incidents })
    );
  }, []);

  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return { state, dispatch, startAnalysis, reset };
}
