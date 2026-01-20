# STAC API Validator Results

## Validator
- Tool: stac_api_validator (official)
- Execution: Python module (`py -m stac_api_validator`)
- STAC API Version: 1.1.0
- Collection STAC version: 1.0.0
- API Base URL: http://localhost:3000

## Command Used

```powershell
py -m stac_api_validator `
  --root-url "http://localhost:3000/" `
  --conformance core `
  --conformance collections `
  --collection 1
Result
The validator completed successfully without any errors or warnings.

No validation errors were reported.