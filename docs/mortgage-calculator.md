# Mortgage Rate Calculator

A live-rate mortgage payment estimator added to the Property record page,
pulling daily interest rates from the FRED API.

## What it does
[screenshot or short GIF of the component in action]

## Architecture
- [`force-app/main/default/classes/MarketRateController.cls`](../force-app/main/default/classes/MarketRateController.cls) — Apex controller
- [`force-app/main/default/classes/MarketRateAPICallout.cls`](../force-app/main/default/classes/MarketRateAPICallout.cls) — FRED callout + parsing
- [`force-app/main/default/classes/MarketRateQueueableJob.cls`](../force-app/main/default/classes/MarketRateQueueableJob.cls) — Queueable Interface to asynchronously callout to FRED API
- [`force-app/main/default/classes/MarketRateCalloutScheduler.cls`](../force-app/main/default/classes/MarketRateCalloutScheduler.cls) — Schedules the queuable job
- [`force-app/main/default/classes/MarketRateFredObservationResponse.cls`](../force-app/main/default/classes/MarketRateFredObservationResponse.cls) — Parses the FRED API response and creates an Observation object that is converted to a Market Rate custom object
- [`force-app/main/default/classes/PropertyController.cls`](../force-app/main/default/classes/PropertyController.cls) — DreamHouse original class, updated to include a query for a property of a specified recordId
- [`force-app/main/default/lwc/marketRateCalculator/`](../force-app/main/default/lwc/marketRateCalculator/) — the component
- [`force-app/main/default/objects/Market_Rate__c/`](../force-app/main/default/objects/Market_Rate__c/) — daily rate storage custom object
- [`force-app/main/default/objects/API_Credential__mdt`](../force-app/main/default/objects/API_Credential__mdt) – Custom metadata object used for holding API Credentials such as keys
- [`force-app/main/default/externalCredentials/FRED.externalCredential-meta.xml`](../force-app/main/default/externalCredentials/FRED.externalCredential-meta.xml) – External Credentials for integration to FRED API
- [`force-app/main/default/namedCredentials/FRED_Mortgage_Rates.namedCredential-meta.xml`](../force-app/main/default/namedCredentials/FRED_Mortgage_Rates.namedCredential-meta.xml) – Named Credentials for integration to FRED API

## Design decisions
- v1 vs v2 FRED API tradeoff: [link to relevant section or inline explanation]
- Why the down payment fields don't fight each other: single source of truth + derived getters
- Why Platform Cache wasn't used: [your earlier reasoning]

## Setup
sf project deploy start
sf org assign permset --name Mortgage_Calculator_Access
sf apex run --file scripts/apex/schedule-fred-sync.apex