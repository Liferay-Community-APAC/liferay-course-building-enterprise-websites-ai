# Level 8 — Commerce: catalog, products and product pages

📖 **Liferay Commerce** organizes products in **catalogs**, describes them with **specifications** (grouped in specification groups) and sells them through **channels**. A site shows products once it's linked to a channel. Clarity's site showcases products without taking orders: visitors browse by category and contact sales.

### 8.1 — The Clarity Eyewear catalog and its specifications

🎯 A **Clarity Eyewear** catalog, a **Frame Description** specification group, and three specifications (Frame Material, Frame Color, Frame Size).

🧩 `commerce-catalogs`

📎 R8.

💬 **Prompt:**
```
Using the commerce-catalogs skill, create the "Clarity Eyewear" catalog
(currency USD, language en_US, with an ERC), a specification group "Frame
Description" (key frame-description, priority 10), and three
specifications in it: Frame Material (key frame-material, used in faceted
navigation), Frame Color (key frame-color, used in faceted navigation) and
Frame Size (key frame-size), each with a short description. Upsert by key or
ERC. Read them back.
```

✅ **Verify:** Global Menu → *Commerce* → *Catalogs*: **Clarity Eyewear**. *Commerce* → *Specifications* → *Specification Labels*: the three labels, with *Frame Description* as their default group, and Frame Material and Frame Color marked *Use in Faceted Navigation*.

### 8.2 — Create the products

🎯 The three products in `context-source/data/products.csv`, categorized, with specifications, images and an AI-written description.

🧩 `commerce-catalogs`

📎 R8.

💬 **Prompt:**
```
Using the commerce-catalogs skill, create the products in
context-source/data/products.csv in the Clarity Eyewear catalog as simple
products, each with an ERC, its category from the "Clarity Products"
vocabulary (create that vocabulary with Eyeglasses, Sunglasses, Contacts
and Lenses at the instance's global scope if it doesn't exist), its tags,
the specification values in the file, its image (priority 10, titled like
the product), a short description from the file, and a full description of
about 120 words that you write in a friendly tone. Publish them. Read them
back with their categories, specifications and image count.
```

✅ **Verify:** *Commerce* → *Products*: three products (none is in *Eyeglasses* yet: Level 9 imports some). Open **Classic Aviator Sunglasses**: *Details* shows the description and the **Sunglasses** category; *Specifications* lists Metal, Gold and 54-20; *Media* shows the image.

📖 Liferay's AI Creator writes descriptions inside the product editor; here your agent wrote them. Your instructor shows both.

### 8.3 — A channel for the public site

🎯 A **Clarity Public** channel (site type B2B) linked to the public site.

🧩 `commerce-catalogs`

💬 **Prompt:**
```
Using the commerce-catalogs skill, create a channel "Clarity Public" (type
site, currency USD) linked to the site clarity-public, with the Commerce
site type B2B. Read it back, with the linked site.
```

✅ **Verify:** *Commerce* → *Channels* → **Clarity Public**: *Type* tab shows **Clarity Public Enterprise Website**; *General* shows *Commerce Site Type* **B2B**.

### 8.4 — Category cards on the Products page

🎯 The Products page shows the four product categories as cards, using a widget template.

🧩 `manage-pages`

📎 R8.

💬 **Prompt:**
```
In client-extensions/clarity-site, on the Products page, add a fixed-width
"Commerce Categories" container with the Commerce Categories Navigation
widget configured on the Clarity Products vocabulary (no root category),
displayed with a new widget template "Clarity Category Cards" (a
Commerce Categories Navigation template): a bento grid of cards in the
order Eyeglasses, Sunglasses, Contacts, Lenses, with widths 8/4/4/8, each
card with its category image (the Marketing files eyeglasses, sunglasses,
contacts and lenses), name, description and an "Explore" button to the
category's page. Look the images up by name with a script before deploying
rather than hard-coding ids, and make sure Guest can see the vocabulary
and its categories. Use the site initializer's ddm-templates for the
widget template. Deploy and check the page as Guest.
```

✅ **Verify:** open **Products** in a private window: four category cards in a bento layout. Site Menu → *Design* → *Templates* → *Widget Templates*: **Clarity Category Cards**.

![The Products page: Eyeglasses, Sunglasses, Contacts and Lenses as image cards with Explore buttons, in a bento layout.](screenshots/8-4-products.png)

### 8.5 — The Product List page and a product display page

🎯 Clicking **Explore** lists the category's products as cards, and each product has a page built from a **Product Details** display page template.

🧩 `manage-pages`

📎 R8.

💬 **Prompt:**
```
In client-extensions/clarity-site:

1. On the Product List page: a Category Content widget under a banner,
   a Search Bar (searching everything), Search Options (empty searches
   allowed), a Category Facet and a Specification Facet in the left
   column, and a Commerce Search Results widget in the right column using a
   new widget template "Clarity Search Results Cards" (product image, name,
   category names and the frame-material specification as a badge).
   Make Product List the channel's default category display page.
2. A display page template "Product Details" for products, on the Primary
   Master Page, marked default: product name, SKU and description mapped to
   the product, a Clarity Button "Contact Sales" linking to /contact-us, a
   "Specifications" section listing each specification's name and value,
   and an "Attachments" section.

Deploy, then check as Guest: open a category from Products, then a product.
```

✅ **Verify:** in a private window, **Products** → *Explore* on **Sunglasses**: the category page shows the facets (Category, Frame Color, Frame Material) and **Classic Aviator Sunglasses** as a card. Click it: its page shows the name, SKU, description, the three specifications and a **Contact Sales** button.

![The Sunglasses category page: facets on the left and the Classic Aviator Sunglasses card on the right.](screenshots/8-5-category.png)

![The Classic Aviator Sunglasses product page: name, SKU, description, Contact Sales button and specifications.](screenshots/8-5-product.png)
