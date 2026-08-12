# Geo And Language Constants

Google Ads takes region and language as constants, never as names.

## Languages

| Language | Constant |
|---|---|
| Russian | `languageConstants/1031` |
| English | `languageConstants/1000` |
| Polish | `languageConstants/1030` |
| Ukrainian | `languageConstants/1036` |

## Countries

Country constants follow the ISO 3166-1 numeric code offset by 2000.

| Country | Constant |
|---|---|
| Belarus | `geoTargetConstants/2112` |
| Kazakhstan | `geoTargetConstants/2398` |
| Uzbekistan | `geoTargetConstants/2860` |
| Armenia | `geoTargetConstants/2051` |
| Georgia | `geoTargetConstants/2268` |
| United States | `geoTargetConstants/2840` |

Russia is deliberately absent: Google Ads has not served it since 2022.

## Cities and regions

**Not yet filled in.** City-level constants do not follow any derivable pattern and must be read from the API rather than guessed. Populate this section from the live catalogue and commit the result:

```
SELECT
  geo_target_constant.id,
  geo_target_constant.name,
  geo_target_constant.target_type,
  geo_target_constant.status
FROM geo_target_constant
WHERE geo_target_constant.country_code = 'BY'
```

Until then, resolve any sub-country region through the same query at request time — one extra call, but a correct one. Never infer a city id by arithmetic or by analogy with another country.
