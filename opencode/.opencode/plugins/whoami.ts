import type { Plugin } from "@opencode-ai/plugin";

/**
 * whoami.wiki plugin for OpenCode.
 *
 * Provides environment setup and session compaction hooks for the
 * personal encyclopedia wiki system.
 */
export const WhoamiPlugin: Plugin = async ({ project, $, directory }) => {
  return {
    hooks: {
      /**
       * Inject vault path and wiki URL into shell environment so `wai`
       * CLI commands work correctly in all shell executions.
       */
      "shell.env": async () => {
        return {
          WAI_VAULT_PATH:
            process.env.WAI_VAULT_PATH ??
            `${process.env.HOME}/Library/Application Support/whoami/vault`,
          WAI_WIKI_URL: process.env.WAI_WIKI_URL ?? "http://localhost:8080",
        };
      },

      /**
       * Preserve core editorial context when sessions are compacted.
       * This ensures the model retains wiki conventions, CLI usage,
       * and editorial standards across long sessions.
       */
      "experimental.session.compacting": async () => {
        return {
          inject: [
            "You are a wiki editor for whoami.wiki, a personal encyclopedia. The wiki owner's details are in the [[Me]] page — use their name, not 'the wiki owner'.",
            "Use the `wai` CLI for all wiki operations (read, create, edit, search, talk, task, source, snapshot).",
            "Follow third-person documentary voice. No editorializing, no promotional language.",
            "Post gaps as talk page threads with {{Open}}/{{Closed}} status, not inline {{Gap}} templates.",
            "Always cite sources using <ref> tags with {{Cite message}}, {{Cite voice note}}, {{Cite photo}}, or {{Cite video}} templates.",
            "End pages with == References == (<references />) and == Bibliography == ({{Cite vault}} entries).",
            "When working from task queue: claim → research → draft → publish → complete/fail the task.",
          ].join("\n"),
        };
      },
    },
  };
};
