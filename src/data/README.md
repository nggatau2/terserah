# Jakarta venue catalog

The [catalog](jakarta.json) contains data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright). The catalog is available under the [Open Database License 1.0](https://opendatacommons.org/licenses/odbl/1-0/). Individual database contents are available under the [Database Contents License 1.0](https://opendatacommons.org/licenses/dbcl/1-0/).

The snapshot is dated in the file and covers venues and named areas mapped inside Jakarta's administrative boundary (ISO 3166-2 ID-JK). It includes named cafes, restaurants, parks, and selected entertainment and activity categories. The catalog is a snapshot and can miss venues or include places that have since closed.

To refresh it, run the [Jakarta query](../../scripts/jakarta.overpass) against an [Overpass instance](https://wiki.openstreetmap.org/wiki/Overpass_API#Public_Overpass_API_instances) once and save the JSON response. Run `node scripts/import-jakarta.mjs <response.json>` from the project root. The importer rounds coordinates, filters venue categories and private venues, and drops nearby duplicates. The app bundles the output and does not query Overpass during use.
