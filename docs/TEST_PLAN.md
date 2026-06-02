# Test Plan

| ID | Module | Scenario | Expected Result | Type |
| --- | --- | --- | --- | --- |
| TC-001 | Shared schemas | Valid FAQ | Parsed successfully | Unit |
| TC-002 | Shared schemas | Blank message | Validation fails | Unit |
| TC-003 | Text chunker | Long text | Multiple chunks produced | Unit |
| TC-004 | AI provider | Prompt construction | Grounding instructions included | Unit |
| TC-005 | Auth middleware | Missing bearer token | 401 response | Integration |
| TC-006 | Documents | Invalid file type | 400 response | Security |
| TC-007 | Documents | Cross-tenant access | 403 or empty result | Security |
| TC-008 | Chat | Question with indexed context | Answer and sources returned | Integration |
| TC-009 | Analytics | Answered chats | Summary counts update | Integration |
| TC-010 | UI | Register to upload to chat | Critical path succeeds | E2E |
| SEC-001 | API | SQL injection string | Rejected or safely parameterized | Security |
| SEC-002 | UI | XSS text in FAQ | Rendered as text, not script | Security |
| SEC-003 | API | Rate limit burst | 429 after threshold | Security |
