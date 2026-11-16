# Avatar asset pipeline

The current avatar is deliberately temporary, hand-authored vector art; it is not production-quality character art. It is composed as independent transparent React/SVG groups, so final SVG or transparent PNG assets can replace individual layers without changing Studio state.

Artboard: 260 × 420, transparent background. Keep the feet on y=361, face centre on x=130, and all layers on the same viewBox. Render order is: base body → back hair → shoes → bottom → top → face → front hair → accessories.

Name final assets character-view-slot-id-vN.svg; for example femme-front-top-lavender-layer-v1.svg. Every item needs an ID, slot, compatible characters, view coverage, thumbnail, rarity, acquisition rule, colour variants, layer order, and version. Add it to the avatar catalog, then make the renderer load that metadata. Never flatten an outfit into one image.

The Studio now has independent catalog slots for hairstyles, hair colour, tops, bottoms, sneakers, chains, earrings, glasses, watches, and bags; skin tones and expressions are independently selectable too. The current SVG renderer draws temporary shapes for these slots and view states; final reviewed assets still need to replace them.

Renderer layer order: back hair → body → shoes → bottoms → tops → face → front hair → accessories. Keep garments inside the shared 260 × 420 artboard and preserve a transparent background. For each production garment, test femme/masc, front/side/back, all expressions, and every compatible bottom/shoe combination at 320px and desktop widths.
