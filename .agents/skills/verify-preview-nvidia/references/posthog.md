# Verify the stored telemetry

Use the configured project and the UTC window recorded for the completed browser visits. Keep synthetic markers, reply fragments and anonymous IDs private. Put counts in the final report. Do not upload the raw report or search with a Vercel cookie, share token, provider key or Turnstile token.

Use `sessions[].startedAt` and `finishedAt` for the UTC bounds, `distinctId` for event correlation, and `inputs.marker`, `replyFragments` and `normalizedReplyFragments` for the text checks. The browser report’s `status` covers the browser run; confirm the provider and stored telemetry separately.

1. Inspect the browser evidence first. Each visitor must have a visible NVIDIA reply, successful collector responses, one `cv_downloaded` with matching `locale` and `cv_locale`, and the fixed OTLP log body `portfolio CV downloaded`. A pageview alone does not exercise the delayed logs pipeline. Capture the synthetic `distinct_id` before stripping unrelated properties.
2. Query stored events using the two anonymous IDs and the bounded UTC window. Group by event name and page/CV locale. The profile and CV navigation normally produce two `$pageview` events per visitor. Reconcile the actual navigation with the browser record. Check for extra events, especially `$autocapture`, `$exception`, and `$ai_generation`.
3. Search **all events in that same window**, including those without the browser IDs, for each unique input marker, a distinctive phrase from the question and distinctive fragments of each answer in raw Markdown and rendered text. Return aggregate counts only. An example HogQL template for stored event properties follows. Use whole-second UTC bounds in `YYYY-MM-DD HH:MM:SS` format. Round the start down and set the exclusive end to one second after the last recorded whole second (for example, `16:44:04.661Z` becomes `16:44:05`). This includes the final partial second. Use these bounds for logs and recordings too. Replace placeholders with bound or safely quoted synthetic values. Repeat for all fragments.

   ```sql
   SELECT event, count() AS received,
          countIf(positionCaseInsensitiveUTF8(toString(properties), '<fragment>') > 0) AS matches
   FROM events
   WHERE timestamp >= toDateTime('<start>', 'UTC')
     AND timestamp < toDateTime('<end>', 'UTC')
   GROUP BY event
   ```

4. Query Logs over the same time range. Confirm the two public messages from service `portfolio-web` with `locale` and `cv_locale` equal to `es/es` and `en/en`. With the PostHog connector, `query-logs` supports `excludeAttributes: true` and computed `customColumns`. For each synthetic fragment evaluate `positionCaseInsensitiveUTF8(concat(toString(body), toString(attributes), toString(resource_attributes)), '<fragment>') > 0`. Include all pages of matches or use aggregate counts. Check Session Replay for recordings of these synthetic visits. An otherwise empty recording list for the entire window also suffices.
5. Refresh the CV dashboard tile. Expect the two controlled downloads to be present. Other visitors may change the global count. If ingestion lags, refresh and poll PostHog with a bounded wait before classifying missing evidence; do not generate another model turn to refresh a dashboard. If IDs are missing, disclose any attribution by UTC window, language and CV edition and identify concurrent traffic that makes it ambiguous.

Report whether any private payload was blocked **before transmission**, any stored conversation fragment matched, any recording appeared, and whether both public positive controls reached storage. Distinguish a leak from unavailable read permissions or missing telemetry. Only mark the hybrid privacy check passed when all three layers agree: provider evidence, browser evidence and stored telemetry.
