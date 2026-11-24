# Level 8 — Commerce: catalog, products and product pages

⏱ **60-minute block** · **Slides:** [Day 2, 11–15](slides/day-2.html#11) · **Learners:** [Level 8](../workbook/level-8.html)

**In this block:** Learners build the catalog, specifications, products, channel and product pages.

**Demos:** D2.6 (5 min)

### D2.6 — The product journey

🕒 **5 minutes** · Day 2, slides 13 and 15 · with the product pages, then at the Level 8 challenge

🎯 **Show:** a product from the visitor's journey back to the catalog and channel behind it.

💡 **Say:** there's no price or cart: the channel showcases products and doesn't take orders.

📋 **Steps:**
1. In a private window: **Products** → a category card → the product list → a product → **expect:** the product's display page with name, SKU, description, specifications and **Contact Sales**.
2. As admin: *Global Menu* → *Commerce* → *Products* → **expect:** the Clarity Eyewear catalog.
3. *Global Menu* → *Commerce* → *Specifications* → *Specification Labels* → **expect:** Frame Material and Frame Color are marked *Use in Faceted Navigation*.
4. *Global Menu* → *Commerce* → *Channels* → **Clarity Public** → *Type* → **expect:** linked to **Clarity Public Enterprise Website**.

### Knowledge check answers

🕒 **5 minutes** · at the end of the block, included in its time · learners answer on their own first, while their last prompt runs ([Level 8, Knowledge check](../workbook/level-8.html#knowledge-check))

💡 **Say:** ask for a show of hands on each option before you give the answer. A split room is the moment to explain.

**Question 1.** You create a second site and add a Commerce Search Results widget to a page. It shows no products, though the catalog has eleven. What's most likely missing?

✔ **Answer: D.** The new site isn't linked to a channel. A site shows products through a channel. 8.3 links Clarity Public to the public site; any other site needs its own channel link before Commerce widgets show anything.

- **A:** They're published and show on the public site.
- **B:** Then signed-in admins would still see them.
- **C:** The widget has a default display.

**Ask next:** Why does Clarity create a channel at all if it takes no orders? (The channel is how a site sees products, orders or not.)

**Question 2.** Visitors want to filter sunglasses by frame size, but the Specification Facet shows only Frame Color and Frame Material. Why?

✔ **Answer: A.** Frame Size isn't used in faceted navigation. 8.1 marks only Frame Material and Frame Color as used in faceted navigation. The Specification Facet only offers specifications with that flag.

- **B:** There's no such limit.
- **C:** It has values (54-20 on the aviators).
- **D:** All three are in that group.

**Ask next:** Why not mark every specification? (A long facet list hurts visitors; pick the ones they filter by.)

**Question 3.** Marketing wants a **New** badge on the category cards on the Products page. Where does that change go?

✔ **Answer: C.** In the Clarity Category Cards widget template. The cards' markup comes from the widget template the Commerce Categories Navigation widget uses. Changing the template changes how the widget displays its items, without touching the data.

- **A:** Products don't control the category cards.
- **B:** The vocabulary holds the categories, not how they're displayed.
- **D:** CSS can style the badge, but the markup comes from the template.

**Ask next:** What does the template read the images from? (Marketing files, looked up by name before deploy, not by hard-coded id.)
