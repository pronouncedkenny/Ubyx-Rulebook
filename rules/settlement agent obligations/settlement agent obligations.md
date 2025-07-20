---
Rule ID: UBYX-00000  
Title: Obligations of the Ubyx-Designated Settlement Agent  
Category: Settlement & Operations  
Status: Draft  
Version: 1.0  
Created: 2025-07-20  
Last Modified: 2025-07-20  
Author: Tony McLaughlin  
Description: Defines the operational and compliance responsibilities of the Settlement Agent nominated by Ubyx Inc. to support redemption flows in each supported fiat currency.  
---

## Rule Overview

For each supported fiat currency, Ubyx Inc. appoints a Settlement Agent to facilitate the movement of funds and tokens between Issuers and Receiving Institutions. This rule defines the Settlement Agent’s core functions, technical integration obligations, and ongoing compliance responsibilities as a key infrastructure node within the Ubyx clearing system.

## Obligations

**1. Obligation 1: Wallet and Cash Account Provisioning**  
The Settlement Agent must provide each approved Issuer and Receiving Institution with:
- One or more institutional digital asset wallets under its control and supervision;  
- One or more fiat-denominated cash accounts, segregated and attributed to the participant;  
- Full KYC onboarding of each entity as a regulated financial client, in compliance with local law.

**2. Obligation 2: Token and Fiat Handling**  
The Settlement Agent must:
- Receive stablecoins from Receiving Institutions into their designated wallets;  
- Respond to authenticated Ubyx platform instructions to route these tokens to the Issuer's wallet for verification;  
- Upon Issuer acceptance, move the equivalent fiat amount from the Issuer’s cash account to the Receiving Institution’s cash account.

**3. Obligation 3: API Integration and Instruction Authentication**  
The Settlement Agent must be continuously connected to the Ubyx platform via a secure and authenticated API to:
- Receive structured settlement instructions from Ubyx on behalf of Issuers and Receiving Institutions;  
- Validate instruction authenticity and timing;  
- Return success, rejection, or status updates in real time or near-real time.

**4. Obligation 4: Status Feedback and Event Streaming**  
The Settlement Agent must provide Ubyx Inc. with continuous event data and transactional status updates sufficient to:
- Inform Receiving Institutions and Issuers of the progress of their instructions;  
- Populate the Ubyx technical platform with accurate and timely clearing status metadata.

**5. Obligation 5: Compliance Monitoring Support**  
The Settlement Agent must provide Ubyx with access to data necessary to support ongoing compliance monitoring, including:
- Current balances of each Issuer’s pre-funded cash account;  
- Confirmation of successful settlement events;  
- Exception alerts and reconciliation failures.

**6. Obligation 6: Performance and Service-Level Reporting**  
The Settlement Agent must support Ubyx Inc. in performance assurance by:
- Logging key transactional milestones (submission, routing, fiat settlement);  
- Providing event-level latency and error metrics;  
- Enabling service-level analysis of redemption speed, uptime, and issue resolution rates.

## Non-Compliance Penalties

Failure by the Settlement Agent to meet its obligations may result in:

- Formal notice and escalation to Ubyx governance;  
- Temporary designation of alternate settlement paths or agents;  
- Regulatory referral or commercial termination in severe cases;  
- System-wide notification of degradation in fiat settlement operations.
