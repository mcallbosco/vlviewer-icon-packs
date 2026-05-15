# VLViewer Icon Packs

Community-contributed character icon packs for the [VLViewer](https://vlviewer.com)
sites (Deadlock and others). Each pack is a folder containing a Source 2 VPK
file (or hand-drawn PNGs, or both) plus a small metadata file. CI extracts the
VPK, builds a preview image, and the live site picks the packs up on its next
build.

## Repository layout

```
packs/
  <game>/
    <pack-id>/
      pack.json              # required: metadata + extraction config
      pack.vpk               # optional: Source 2 VPK to extract
      icons-extra/           # optional: hand-tweaked PNG overrides
        minimap/
        normal/
        gloat/
        critical/
      cover.png              # optional: thumbnail for README listings
schemas/
  pack.schema.json           # JSON schema for pack.json
tools/
  extract.mjs                # local "test extraction" helper
.github/
  workflows/
    pr-preview.yml           # builds preview comment on every PR
    validate.yml             # schema + structure check
```

## Variants

Every pack supports four variants per character. The standard Deadlock
mapping is:

| Variant id | VPK suffix             | Pixel size |
|------------|------------------------|------------|
| `minimap`  | `_sm_psd`              | 192×192    |
| `normal`   | `_card_psd`            | 333×450    |
| `gloat`    | `_card_gloat_psd`      | 333×450    |
| `critical` | `_card_critical_psd`   | 333×451    |

Variants are optional. A pack can ship only the ones it has; the site falls
back to the default pack for missing variants. Users on the site choose
independently which variant maps to the non-hover image and which to the
hover swap.

## Contributing a pack

1. Fork this repository.
2. Create a new folder under `packs/<game>/<your-pack-id>/`.
3. Zip your VPK and drop it in as `pack.vpk.zip` *and/or* PNGs under
   `icons-extra/<variant>/`. VPKs compress ~95–97%, and GitHub rejects single
   files over 100 MB, so a raw `.vpk` usually won't push — zip first:
   ```sh
   zip -9 pack.vpk.zip path/to/your.vpk
   ```
   CI auto-unzips before extraction. Plain `.vpk` is supported for the
   rare pack that fits under the limit.
4. Write a `pack.json`. Minimum required fields:

   ```json
   {
     "$schema": "../../../schemas/pack.schema.json",
     "id": "my-pack",
     "game": "deadlock",
     "label": "My Pack",
     "familyId": "official",
     "license": "Personal-use; not for redistribution.",
     "credits": [
       { "name": "Your Name", "url": "https://example.com" }
     ],
     "vpk": "pack.vpk.zip"
   }
   ```

5. Open a pull request. CI will reply with an inline preview image. If
   anything is wrong, the validation workflow will tell you.
6. A maintainer reviews and merges.

## Testing locally

```sh
# Extract and validate your pack into ./build/ for visual inspection.
node tools/extract.mjs packs/deadlock/my-pack
```

The helper looks for `Source2Viewer-CLI` in `$S2VIEWER_BIN`, then
`~/Apps/S2ViewerCLI/Source2Viewer-CLI`, then your `$PATH`.

## License

This repository's tooling and schemas are released under MIT (see `LICENSE`).
Each pack's assets are licensed per its `pack.json` `license` field — it is
the contributor's responsibility to declare their license. Packs whose
license field is missing or unclear will not be merged.
