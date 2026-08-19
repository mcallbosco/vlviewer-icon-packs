# Art Brawl portrait pack — consent notes

This is the audit trail for `packs/deadlock/art-brawl/`. Re-check this file before adding or restoring any portrait.

## Pack facts

- Gamebanana: https://gamebanana.com/mods/688171
- Pack id: `art-brawl`, `hidden: true` (quiet launch; not in pickers unless already selected, event override, or VLViewer hidden-pack reveal)
- License: CC BY-NC-ND 4.0
- Discord: https://discord.com/invite/74MJ4KkRep
- Source zip: `artbrawlportraitsv3.zip` stored as `pack.vpk.zip`
- Extraction: Neutral `_card_psd` → `normal`; Gloat `_card_gloat_psd`; Critical `_card_critical_psd`; Character Select `_vertical_psd` → `character-select`
- The VPK still contains every portrait. **The website only ships files that survive `excludeIcons`.** Deploy VLViewer extractor support for `excludeIcons` before this pack.

## Rule

**Only include a portrait if the credited Gamebanana artist for that slot can be matched to a Yes on the consent spreadsheet** (Discord username, handle, and/or preferred social).

- Every form response so far is **Yes**. Nobody opted out. Exclusion means **no matching row**, not a No.
- Do **not** include a slot just because someone consented to that character/type under a **different** name we cannot tie to the credit.
- Matching may use aliases (same person, different handles). Matching must **not** be slot-only.

Modders (`DatSir`, `DragonRoIlZ`) stay in `credits` as implementation. DragonRoIlZ also consented for Kelvin Gloat, which is included.

## Sources

| What | Where |
|---|---|
| Consent form responses | `c:\Users\Mcall\Downloads\Deadlock Voiceline Viewer Consent Form (Responses) - Form Responses 1.csv` |
| Gamebanana credits HTML (local snapshot) | `D:\Projects2\credits.html` |
| Working exclusion scratch list | `D:\Projects2\artbrawl-consent-exclusions.txt` |
| Live exclude + credits | `packs/deadlock/art-brawl/pack.json` |

Rebuild credits from `credits.html`, skip every excluded slot, then set `excludeIcons` to the paths below.

## Character stems in this VPK

| Character | Stem |
|---|---|
| Abrams | `bull` |
| Apollo | `fencer` |
| Bebop | `bebop` |
| Billy | `punkgoat` |
| Calico | `nano` |
| Celeste | `unicorn` |
| The Doorman | `doorman` |
| Drifter | `drifter` |
| Dynamo | `sumo` |
| Graves | `necro` |
| Grey Talon | `archer` |
| Haze | `haze` |
| Holliday | `astro` |
| Infernus | `inferno` |
| Ivy | `tengu` |
| Kelvin | `kelvin` |
| Lady Geist | `spectre` |
| Lash | `lash` |
| McGinnis | `engineer` |
| Mina | `vampirebat` |
| Mirage | `mirage` |
| Mo & Krill | `digger` |
| Paige | `bookworm` |
| Paradox | `chrono` |
| Pocket | `synth` |
| Rem | `rem` |
| Seven | `gigawatt` |
| Shiv | `shiv` |
| Silver | `werewolf` |
| Silver (Werewolf) | `werewolf_wolf` |
| Sinclair | `magician` |
| Venator | `priest` |
| Victor | `frank` |
| Vindicta | `hornet` |
| Viscous | `viscous` |
| Vyper | `kali` |
| Warden | `warden` |
| Wraith | `wraith` |
| Yamato | `yamato` |

Confirmed in the v2/v3 VPK directory listing: Graves=`necro`, Apollo=`fencer`, Sinclair=`magician`, Silver=`werewolf`, werewolf form=`werewolf_wolf`. Paige (`bookworm`) and Rem (`rem`) are different files.

## Alias matches (included)

These credit names are **not** identical to the spreadsheet username, but the same person is on the form:

| Credits name | Spreadsheet / social |
|---|---|
| Silicarte | Deebie (Venator Gloat); social Silicarte |
| NorwegianOekaki | Nor / norweegles (Critical Celeste) |
| chapioca | toxicyuri; Twitter chapioca (Grey Talon Character Select) |
| eternalnslaught | moonshine_inkwell / eternalnslaught (Graves Character Select) |
| Articblueharmony | @articblueharmony (Celeste Character Select) |
| Eema Artz | eematidesong Eema Artz — form said “Abrams” (Abrams Character Select) |
| Mick.bat | mick.rar / may.bat_ (Silver Werewolf Neutral); credit URL overridden to https://x.com/maydotbat |
| yan | Edgichel; Twitter edgichel (Paige Character Select) |
| heaveria | romeotoophelia; tumblr heavereia (Apollo Character Select) |
| Wild-ShiftingCuriosity | wildone333 (Grey Talon Neutral) |
| tteoktokki | tteoktokki_ (Bebop Neutral) |
| Compound | Compound (compoundbl) consented Bebop Neutral **and** Character Select |
| virtualviscera | mach / tayparfait (Paradox Gloat) |
| ViscousLover1000 | mr.edge; Twitter _MrEdge_ (Viscous Character Select) |
| Carpe6iem | Karchivist; Twitter Carpe6iem (Wraith Character Select) |
| basilisken | roosterdevil / kurenai_chi (Ivy Gloat) |
| ken | _kendrick; Twitter PHO_kg (Abrams Gloat) |
| reyze.art | Daddykink25; Instagram reyzeartz (Calico Gloat) |
| patty melt | Eva / ev4ngelica1; Twitter pattymeltforeva (Billy Gloat) |
| makaraig | seeeenyoooor; Twitter senyor_elias (Paige Critical) |
| lemon | catboynishidagaming (Mirage Neutral) |
| oryean | reyhan._ / Oryean11 (Wraith Neutral) |
| aether | divinemode; Twitter divinemodes (Doorman Critical) |
| Lethe | divinemachina / lethe; Twitter 1ethe_ (Paradox Character Select) |
| swagmaster | masterofswag; Twitter 39nfdc (Doorman + Warden Neutral) |
| Nimbus | @cumulativnimbus (Graves Critical) |
| celerys0da | duk5233 (Bebop Gloat) |
| kingknightt | @pon.gorma (Victor Critical) |
| ladiesman217 | @catshapedpancakes (Drifter Gloat) |
| iiclarkrau | iclark (Doorman Gloat) |
| Dena | DeniaLei; Twitter denial_ei (Haze Neutral) |
| michelle | avacadolimeranch / michelle (Silver Gloat) |
| Lycangnoll | Lycangnoll / Adricovy (Billy Character Select) |
| salmondot | salmon. / salmondot; Instagram ssalmondott (Seven Character Select) |

Unnamed Character Select form rows (**“Character Select” only**) were included **only** when the social/handle on that row matches the credited artist: chapioca, eternalnslaught, Articblueharmony.

## Explicitly not included

**Calico Character Select** (`character-select/nano.png`), credited as **Highwaysight**.

summerbreathe consented to “Character select calico” on the spreadsheet, but that name/handle does not match Highwaysight. Slot-only consent is not enough. Do not restore this file unless Highwaysight appears on the form.

Two different **Apollo** credits exist: Drifter Character Select is poliaths (consented); Wraith Gloat is faceyourfailures (not on the form — excluded).

**Yamato Neutral** (`normal/yamato.png`) stays excluded. Levi / levi_the_human consented to Yamato Neutral on 2026-08-18, but Gamebanana credits **KnightlyCarp** (x.com/KnightlyCarp). Do not restore unless those are the same person.

## Excluded portraits (`excludeIcons`)

39 files. Missing paths are ignored by the extractor.

### Neutral

| Artist | Character | Path |
|---|---|---|
| sleepyyqueen | Calico | `normal/nano.png` |
| BURGER | Dynamo | `normal/sumo.png` |
| Citrus | Graves | `normal/necro.png` |
| QCaine | Holliday | `normal/astro.png` |
| Fawst | Lady Geist | `normal/spectre.png` |
| Lo | McGinnis | `normal/engineer.png` |
| liv | Pocket | `normal/synth.png` |
| boiledkettles | Seven | `normal/gigawatt.png` |
| scizbone | Vindicta | `normal/hornet.png` |
| Surge | Vyper | `normal/kali.png` |
| KnightlyCarp | Yamato | `normal/yamato.png` |

### Critical

| Artist | Character | Path |
|---|---|---|
| Trashy_Opossum | Apollo | `critical/fencer.png` |
| _mmmmmmicrowave_ | Bebop | `critical/bebop.png` |
| clementine | Calico | `critical/nano.png` |
| Anger | Drifter | `critical/drifter.png` |
| Twistanity | Haze | `critical/haze.png` |
| Wcros5 | Lash | `critical/lash.png` |
| naila | Mina | `critical/vampirebat.png` |
| SOL | Shiv | `critical/shiv.png` |
| GGabe | Sinclair | `critical/magician.png` |
| _momorio_ | Vindicta | `critical/hornet.png` |
| goteboy | Vyper | `critical/kali.png` |
| happy | Wraith | `critical/wraith.png` |
| gap_moe_art | Yamato | `critical/yamato.png` |

### Gloat

| Artist | Character | Path |
|---|---|---|
| Xyrenity | Graves | `gloat/necro.png` |
| RoliKoli | Holliday | `gloat/astro.png` |
| sadakuo | Lady Geist | `gloat/spectre.png` |
| Snoozincopter | McGinnis | `gloat/engineer.png` |
| Kirachune | Mina | `gloat/vampirebat.png` |
| Bruhness81 | Mo & Krill | `gloat/digger.png` |
| t4ppyy | Paige | `gloat/bookworm.png` |
| scabherd | Shiv | `gloat/shiv.png` |
| brusheteer | Victor | `gloat/frank.png` |
| 大凝子 | Warden | `gloat/warden.png` |
| Apollo (faceyourfailures) | Wraith | `gloat/wraith.png` |

### Character Select

| Artist | Character | Path |
|---|---|---|
| Tataquio | Holliday | `character-select/astro.png` |
| MoonlitMinuet | Vindicta | `character-select/hornet.png` |
| Nim | Venator | `character-select/priest.png` |
| Highwaysight | Calico | `character-select/nano.png` |

When a new Yes lands, remove that path from `excludeIcons` **and** add the Gamebanana credit back to `credits`.

## Pipeline reminder

`excludeIcons` entries are `variant/character.png` (case-insensitive). The VLViewer trusted extractor (`scripts/extract-icon-pack.mjs`) is what the site uses; the copy in this repo is for local/CI parity.

`hidden` only affects pickers. It does not skip extract. Consent is enforced only by `excludeIcons`.
