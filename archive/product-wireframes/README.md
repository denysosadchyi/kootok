# Архів продуктових вайрфреймів (урок 4)

Ці 60 продуктових вайрфреймів і сторінок станів прибрано з активних маршрутів
2026-09-17 на запит користувача. Кожен файл перенесено байт-у-байт і дано
невиконуваний суфікс `.html.archived`.

**Які саме байти лежать тут.** Архів — пост-міграційні версії 17.09 (сторінки
посилаються на `/kootok/tokens.css` і `/kootok/components/index.css`), а не
байти HEAD `05acc4c`. Версії HEAD доступні в git-історії
(`git show 05acc4c:research/wireframes/<name>.html`). Маніфест SHA-256 нижче
описує саме архівні (пост-міграційні) байти.

## Як відновити файл

1. Скопіюйте архівні байти назад у `research/wireframes/<name>.html`, прибравши
   кінцевий суфікс `.archived`.
2. Замініть шляхи до CSS: `/kootok/tokens.css` + `/kootok/components/index.css`
   → `/kootok/design-system/index.css` (старих файлів у корені більше немає).
   Спільний `_wireframe.css` і скрипти лежать у `support/` — поверніть і їх.
3. Свідомо відновіть маршрут, документацію й QA-покриття, які мають показувати
   цю сторінку. Не віддавайте архів як HTML.

## Що в `support/`

Тека `support/` окремо зберігає вже невикористані галерею, redirect-alias,
scaffolds, спільні CSS/JS вайрфреймів, локальні іконки, документи
critique/conventions і колишні інвентарі токенів і компонентів. Це не активні
маршрути й не runtime-залежності.

Свідомо прибрані без активної заміни: `ui/kit.css` (→ `design-system/components/`),
`ui/inventory.md`, `scripts/check-kit.sh` (→ `scripts/qa-lesson-8.mjs`),
`wireframes.html`, `research/wireframes.html` — їхні копії HEAD лежать у
`support/*.archived` (кладе пакет P2).

## Маніфест SHA-256

- babefa4d2d618a6db3d397472bc8e9ef6b6a291ad70d62cf9510d66bd6306dc0  chat-empty.html.archived
- 4204e07ac3017e45bb3290d4079ece36121918e01c2ddb2d84d8e053953e52a6  chat-error.html.archived
- 276ce25e05f466759402e256c8caee235335bab9018b5c46dffb8ef16ceaa697  chat-loading.html.archived
- 9203d95736055a415fcb1318d8c8797e04fd421313cbce168f9240080a505b20  chat.html.archived
- 7a8a3936de9c82d95dbc0c7c1f0c5817b59b6b2002e39957840ddfcb9459f529  chats-empty.html.archived
- 5581f91f11cc6d02c289ad7b86dfd24af4f8dbd24b90ea18241f69036e8ab359  chats-error.html.archived
- 2b01751449f965297d6f0f8a2469e715d04a818f527038c3a1155c87f3cb9a12  chats-loading.html.archived
- 217c7fad302d53a7102cd66e257ad7b84bb523feddefe8663c2f5edc1c944239  chats.html.archived
- 434a7e96a91c76432fc32dd4a176a56cfda9163a5b5d110865a283b5c2a739f0  filters-empty.html.archived
- c52652e6933f526409c295c9f78a7fba6c1693a4907591005a48053374f83900  filters-error.html.archived
- cd9c7486f81b08005654ab9f017cb0ad3579d2464b8a24129ddfdfdb57a5a437  filters-loading.html.archived
- b5c6b4484bb09be3fb4c2e090c3b9c392916529cb1c08b2cb83b3d3a385063f5  filters.html.archived
- eed2cec8ff7c9258861fb4b17b7335d38286631541ec3cd959ccd1cd4a4628ce  listing-empty.html.archived
- 4423cde9d4684d9e5d21703f3d3c3425986f1592e66b2f047e2df42d15978356  listing-error.html.archived
- 7d375e13d59bbf9e0dba5d58ad8d7c51270e76c3d600e38aee0afa3ff6d7a189  listing-loading.html.archived
- 04a0bfc56c1a917444f9e60afa8c13219cd80a1d2ffe39a43041762f00fd799a  listing-new-empty.html.archived
- 5f1de4a13d213fa8061aa8946fcaec6363557ba38b4f2267c1f935e8e70c655c  listing-new-error.html.archived
- cec498aaca27d8b3538faca6e8cd3fa3a458290d36cb09bfed6ad0f6a3a24bf7  listing-new-loading.html.archived
- e1dc21b4dca99fd2f530067e22f4d08d4de9913c9dfbbdc29af72c6f95c26ba1  listing-new.html.archived
- d2f309c131b565a6f07c0634212e4da09cfcda0f571b825154349c98c08cc0e1  listing.html.archived
- 7697af32d871ecac072ef1a894b24a2d345970434dfb57af914f3aa8dbe43923  listings-empty.html.archived
- ce5d9183188a8f3d90c3780f7dae0853ab51904f12927b49b0484f61c28f37fe  listings-error.html.archived
- 7f11ae58fb78f7ef094a2d01ae113eb1382e8f59970f3dece1b4e7321d009ee0  listings-loading.html.archived
- 624d2cce7e5a9e737fae32aae298023aaf6cf1dc0b9d0ed024b65bcf2484f08e  listings.html.archived
- a53c9e63ece0d29f57eadad682360a5afa29816686aedecd45a5d36117f0d976  my-listings-empty.html.archived
- efe65a972665933e1d13da8d7900e4f3f30c6d34ee5c9b8ae1ae9829d2774d30  my-listings-error.html.archived
- 7e2d1bd99348189aa424d5758f6aad15976a55fac9811550945f6649f411a70b  my-listings-loading.html.archived
- f640653a30ab513467e4382d859fd82df3c0ff341fef6bf2e4752cac4e1cbeab  my-listings.html.archived
- f04627f599a2cc9515e1a2c9197b496d3185324251d5e7e642208dd52f828074  person-empty.html.archived
- 00b859e8247f49c97147e84e234ee7012b3cd81260866626478e4342faafcbb9  person-error.html.archived
- 158b3a22a83a82c9e4ff4d218e2a1bf9f49c77a18153a2841428a4328dd09d64  person-loading.html.archived
- 81921cec47eea7931483fba4d3e032152f4044717ae89058a129510d3e4d3ec4  person.html.archived
- cf1f286ff2a339d7bcff83009ec7d4fa4e6a7f2baecbbec1c560800fe9f9fdd3  profile-edit-empty.html.archived
- a20b6772d8513c26d9889787b74d3828265611c75f7737908c9be128c1894d7f  profile-edit-error.html.archived
- e39ab80d34f7fc1860e9a4e0f2f678f64bd208472409ff887eff409a570699ec  profile-edit-loading.html.archived
- 583b7484144f77202268fdeb2f6180db159b21a89db9a413a336688e9d12172e  profile-edit.html.archived
- d7190e03c283accfc429e5c2af7c959ab07f2f27ead830a2cb39afeb984e8351  profile-social-empty.html.archived
- 78eec3753610129be18198c6b442eff5b01c9124befac4b2453178c96d526dfe  profile-social-error.html.archived
- 7fba8b01dd874b5278cc21ffc12ad734f170cb50de334342761f6c0160615272  profile-social-loading.html.archived
- d7ce7da91896fba3f8999193474235917b61c499990066f728b60e660f746e1c  profile-social.html.archived
- d49695483588e5dbc5431cc4677b5e9c178b8bc2c726cc22f772d45f19491643  report-empty.html.archived
- 79e0b4706c7a9e4540b1e1fc68a039702e970d835d6605c5ee039bf82ba0a69e  report-error.html.archived
- 2269a1302bf171a0abb410028a3d0b8a6e4a45450c19040d1d8907b4ae043502  report-loading.html.archived
- a9a44a4d340c4a5e4110530902d8b37b9a1c4811468247da2f1cc85229dc1915  report.html.archived
- f80bd1b5e3a0e3c63ea8347a0de3883fba5c411993f53a52a3ddae16597accf6  review-empty.html.archived
- a041065e5e6a09f8199215d6e080a650dc81b1a58a2d47d0e2bcadd200cabd94  review-error.html.archived
- 8fac96a4a825c40647ce5f6900c22686b5f3ff427d3a563a96f8b768d31f78a6  review-loading.html.archived
- 1a843ca67107cbe54f8745607299cb7f3e01758afd5df0450a3f1d6d7b2cdec0  review.html.archived
- 254560796a561dde3b88de6a43531027320627689fd7b75e4388a926dfc297bb  role-empty.html.archived
- c46122012f694ec9f39087ac4f934d4aa89a7c2f6839fa7e4de7abc8acc0597b  role-error.html.archived
- a9dc21a92a45b864a4d3138da38630d20802c9fec2f72aea781fc499c942f797  role-loading.html.archived
- 6f7b83480ff9e975792cc87626e32cc8cf74fcbd2d2d360736482882e03dcb1b  role.html.archived
- 9ef8773a9d97429d3eccaea0ba4ce7278f72f682ad1f6a0cf8b326bb5affa099  seekers-empty.html.archived
- 2dcb4c7c6bad8cfdfa898258c5801a0d901a279ee98fdb2d85edcca6867840ae  seekers-error.html.archived
- d9f8306af17cc9b8aaab8d30e78c17aabc2d06c7a2982481b0af391e5e8c91fc  seekers-loading.html.archived
- 74c0ba80de0ee338415ccfb95dd90923d5b59af200145428ab8363fd572a7834  seekers.html.archived
- 404d14ff315576c0895443ebd8f647d612b2d393b46cdecfe94f9460b03140e2  signup-empty.html.archived
- 53fb8f98e03f8fed8b309094b21a5242c1f2f34e05f7b82ef627ae3bc43d5855  signup-error.html.archived
- ae7294550dfa110e485018b104ce97247ace9aa749bcf86f7c9097490d7cbf4e  signup-loading.html.archived
- e55da87fb8ece254690b567fda7216f64de2fa51b3d32966efece29e02d52151  signup.html.archived
