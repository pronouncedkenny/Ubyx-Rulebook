---
Rule ID: UBYX-00000  
Title: Travel Rule Compliance for Redemption Transactions  
Category: Receiving Institution Obligations  
Status: Draft  
Version: 1.0  
Created: 2025-07-20  
Last Modified: 2025-07-20  
Author: Tony McLaughlin  
Description: Requires Receiving Institutions to transmit originator and beneficiary information with each stablecoin redemption to meet Travel Rule obligations.  
---

## Rule Overview

This rule requires Receiving Institutions to comply with the Financial Action Task Force (FATF) Travel Rule and equivalent regulations when redeeming stablecoins via the Ubyx clearing system. Participants must transmit required originator and beneficiary data through the Ubyx platform as part of the redemption message.

## Obligations

**1. Obligation 1: Mandatory Data Transmission**  
For every redemption request submitted via the Ubyx platform, the Receiving Institution must supply the required originator and beneficiary information in accordance with applicable Travel Rule obligations.

**2. Obligation 2: Minimum Data Fields**  
The transmitted data must include at least:
- Full name of the originator (sender of the stablecoin);  
- Wallet address or other unique identifier of the originator;  
- Full name of the beneficiary (the customer of the Receiving Institution);  
- Beneficiary account or reference identifier;  
- Any additional required identifiers (e.g., national ID, date of birth, or address) as required by local law.

**3. Obligation 3: Secure and Structured Format**  
Travel Rule data must be transmitted securely and in a structured, machine-readable format that complies with Ubyx technical specifications and applicable global standards (e.g., IVMS 101 or ISO 20022 extensions).

**4. Obligation 4: Use of Ubyx Messaging Infrastructure**  
All Travel Rule information must be routed through the Ubyx platform as part of the redemption process. Side-channel, off-ledger, or informal methods of transmission are not permitted.

**5. Obligation 5: Retention and Auditability**  
Receiving Institutions must retain records of submitted Travel Rule data for a minimum of five (5) years or such longer period as required by applicable law. These records must be auditable and made available to Ubyx or regulators upon request.

## Non-Compliance Penalties

Failure to transmit valid Travel Rule data may result in:

- Immediate rejection of the redemption request;  
- Temporary or permanent suspension of the Receiving Institution’s access to the Ubyx platform;  
- Increased compliance oversight or mandatory remediation;  
- Referral to regulatory authorities for further investigation.
