# Simulation Attachment Verification

The generated `Marketing_Performance.pdf` was reviewed visually. It contains a Gulf Retail Group Business Intelligence header, the Q4 Riyadh North evidence narrative, and a readable metric table covering the 42% campaign-budget decline, 38% reach decline, and 34% attributed store-visit conversion decline.

The generated `Sales_Data.xlsx` was reviewed structurally. It contains a `Sales Data` worksheet with 601 rows and 16 columns, representing 600 deterministic simulation records plus a header row, and a `Case Summary` worksheet with the workbook purpose and investigation prompt. The workbook is appropriate for direct download and spreadsheet review.

## Live browser verification

In a fresh authenticated Junior Data Analyst session, clicking the inbox download control for `Sales_Data.xlsx` saved `Sales_Data_aeb9d998.xlsx` to the browser download directory at 57,818 bytes. Clicking `Management_Request.pdf` opened the managed CloudFront PDF viewer and displayed a one-page Gulf Retail Group Management Brief with the SAR 100,000 constraint and a readable evidence table. This confirms the email attachment links resolve to real Excel and PDF payloads in the browser.
