# Diet Rotation Maintenance Notes

## Shopping list source of truth

The shopping-list retailer data must come from `data/diet-retailer-equivalents.xlsx`.
Do not hardcode Coles/Woolworths shopping rows directly in `pages/index.js`.

When changing supermarket products, prices, pack sizes, or notes:

1. Update `data/diet-retailer-equivalents.xlsx`.
2. Run `npm run sync:retailers`.
3. Commit both the spreadsheet and regenerated `data/retailer-products.json`.

The app imports `data/retailer-products.json` at build time. The JSON is generated data, not the hand-edited source.
