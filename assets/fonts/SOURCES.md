# Self-hosted fonts

The UI uses two variable WOFF2 families, served from this directory with no
runtime CDN dependency:

- **Jost** `500–800`, Cyrillic + Latin. Display/UI voice for headings,
  buttons, tabs, prices, chips and short labels. Source family:
  `google/fonts/ofl/jost`, upstream commit
  `35f141c970538f1ed0f235789c19156b3ce2a762`.
- **Golos Text** `400–700`, Cyrillic + Latin. Reading face for body copy,
  form input, support, meta and footer text. Source family:
  `google/fonts/ofl/golostext`, upstream commit
  `cf2e27222937d97c2d858fff0499bcc667a64e9d`.

The subset files are the Google Fonts WOFF2 distributions referenced by the
CSS API on 2026-09-17. SHA-256:

```
732ac61fdb7b964d3edfe40fe4a96aba1d1e34c349aebf0353118f8bda4aabdb  jost-cyrillic-500-800.woff2
7726a5cd6f3c0e876c028ea2a643d45f7aad4b0f164b70966c669f4a4668f4b9  jost-latin-500-800.woff2
17d048ca05cb1218af3c0d6dcdf882989e6d1cc5dcb598ea50eaf54850ff7229  golos-text-cyrillic-400-700.woff2
9a69d0aa4734c4022224c002a3d944a702e0204972a49d892789f5668b922c2a  golos-text-latin-400-700.woff2
```

Both families are licensed under the SIL Open Font License 1.1. Exact
upstream copyright notices and license text are retained in `OFL-Jost.txt`
and `OFL-Golos-Text.txt`.
