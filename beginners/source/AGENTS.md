# Project instructions

## Figmosha and Figma

- The active Figma Desktop session runs on Dell. Connect through SSH alias `nerdf` (`nerdf@192.168.31.209`) and use `C:\Users\nerdf\figmosha2\figmosha.py`. Set `PYTHONIOENCODING=utf-8` when the result contains Ukrainian text.
- Build imported mobile screens with nested Figma Auto Layout from the start. Use absolute positioning only for intentional overlays such as a FAB or home indicator.
- Reuse the exact source assets whenever they exist. Before drawing any icon, image, logo, or vector manually, search the source page and adjacent asset directories. Import the original SVG byte-for-byte apart from an intentional color substitution; never replace an available asset with an approximate hand-drawn version.
- In the Figma Plugin API, `primaryAxisSizingMode` and `counterAxisSizingMode` use `"AUTO"` for Hug contents. Apply sizing again after reparenting a node when necessary, because inserting it into another Auto Layout can leave it fixed.
- Any text that may wrap must use `textAutoResize = "HEIGHT"`. Its immediate row must hug height (`counterAxisSizingMode = "AUTO"` for a horizontal row), and every vertical ancestor that contains it must also hug its primary axis. Never combine wrapping production copy with a fixed-height row.
- Chips must hug their labels after they are appended to the wrapping container. For tag groups use `layoutWrap = "WRAP"`, a fixed available width, `counterAxisSizingMode = "AUTO"`, and explicit `counterAxisSpacing` as well as `itemSpacing`.
- Test layouts with the longest real strings, not only the shortest example. In repeated cards, inspect every card because different copy can change wrapping and height.
- For a full mobile layout shown without scrolling, disable clipping on the content/root frames and let their vertical primary axis hug content. Reposition intentional absolute overlays only after reading the final computed frame height.

## Figma verification checklist

After every Figmosha layout mutation:

1. Query the resulting node tree and confirm all structural frames use the intended `layoutMode`.
2. Query text, parent, and row dimensions for wrapping content. A text node's rendered height must fit inside every ancestor row.
3. For chips, compare label width with chip width and confirm padding is included; inspect chip `x/y` positions to verify wrapping.
4. Confirm repeated cards have content-driven heights and no fixed-height container clips text.
5. Report completion only after these geometry checks pass.
