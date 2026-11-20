# Clarity Vision Solutions — Public Enterprise Website Brief

Clarity Vision Solutions ("Clarity") is a fictional eyewear manufacturer. It designs and sells **eyeglasses, sunglasses, contact lenses and prescription lenses**, mostly through distributors and retail partners. This brief describes the public enterprise website Clarity wants to build on **Liferay DXP 2026.Q3**. It's the running case for the *Building Enterprise Websites with Liferay and AI* course.

## 1. Goals

The website must:

1. **Increase brand awareness**: tell Clarity's story, its leadership and its innovations.
2. **Showcase products**: a browsable catalog by category, with a page per product.
3. **Convert visitors**: turn visitors into customers, distributors and job applicants (contact form, open positions, distributor promotion).
4. **Serve an international audience**: English (United States) and Spanish (Spain).
5. **Be run by a team, not one administrator**: each persona gets only the permissions their work requires, and new content is approved before it goes live.

## 2. Personas

All personas use the password `learn` in the training environment. Email domain: `clarityvisionsolutions.com`, except the external distributor Terrence Wheatley (`terrence.wheatley@distributor.com`). `context-source/data/personas.csv` has every address.

| Screen name | Name | Job title | Department (user group) | Responsibilities on the site |
| --- | --- | --- | --- | --- |
| `admin` | Clarity Admin | Administrator | — | Instance-level settings only. |
| `ianmiller` | Ian Miller | IT Manager | IT | Sites, commerce catalog, objects, Publications. |
| `walterdouglas` | Walter Douglas | Web Developer | IT | Pages, master pages, fragments, design, search pages. Site Administrator of the public site. |
| `claramurphy` | Clara Murphy | Marketing Manager | Marketing | Owns marketing content; approves articles. |
| `christiancarter` | Christian Carter | Marketing Coordinator | Marketing | Writes articles, FAQs and announcements. |
| `harperroberts` | Harper Roberts | Human Resources Specialist | Human Resources | Job listings. |
| `danielraymond` | Daniel Raymond | Distributor Representative | Support Agents | Follows up Contact Us requests. |
| `terrencewheatley` | Terrence Wheatley | Distributor (external) | Distributors | A distributor who signs in to the public site. |

### User groups

| Name | Description |
| --- | --- |
| Distributors | Clarity's distributor representatives. |
| Human Resources | Members of the human resources department at Clarity. |
| IT | Members of the IT department at Clarity. |
| Marketing | Members of the marketing department at Clarity. |
| Support Agents | Members of the support department at Clarity. |

### Roles

| Type | Title | Description |
| --- | --- | --- |
| Regular | Content Manager | Clarity role for those managing content on Liferay. |
| Regular | IT Manager | Clarity role for a manager within the IT department. |
| Regular | Web Developer | Clarity role for a front-end developer within the IT department. |
| Regular | Marketing Coordinator | Clarity role for an individual contributor from the marketing team. |
| Regular | Distributor Representative | Clarity role for staff who follow up distributor and visitor requests. |
| Site | Site Content Contributor | Site-based role for those contributing to the Clarity site. |

## 3. Sites

| Site | Friendly URL | Purpose |
| --- | --- | --- |
| **Clarity Public Enterprise Website** | `/clarity` | The public marketing website (this course). Virtual host `www.clarityvisionsolutions.com`. Open membership. Languages: English (US) default, Spanish (Spain). Accessibility menu enabled. Description: *"Elevate Your Brand with Premium Eyewear: Discover premium craftsmanship, innovative lenses, and designs that help your brand stand out."* |
| Clarity Distributor Portal | `/distributor-portal` | A future B2B storefront for distributors. Created empty in this course. |

The instance's home page, default landing page and default logout page all point to `/web/clarity`.

## 4. Site map

```
Home
Products
└── Product List          (products of one category)
    └── Product Detail     (served by the Product display page template)
About Us
Blog
FAQ
Careers
└── Open Positions         (job search)
Events                     (upcoming hiring events)
Contact Us                 (Contact Us form)
Contact Us Responses       (internal: pending requests, hidden from navigation)
Search                     (site search results)
Sign In                    (utility page)
```

Display page templates: **Leadership Profile**, **Article**, **Product Details**.

### Master pages

| Master page | Used by | Contents |
| --- | --- | --- |
| **Primary Master Page** | Every content page | Header: announcement bar, then a navigation bar with the Clarity logo (links Home), the Header Page Menu, a search button and the login/user menu. Footer: branding, navigation columns (resources, company, legal) and copyright. |
| **Secondary Master Page** | Sign In utility page, Leadership Profile display page | Same header without the announcement bar; footer without the branding and navigation columns. |

### Navigation menus

| Menu | Items |
| --- | --- |
| Header Page Menu | Products, About Us, Blog, FAQ, Careers, Contact Us |
| Footer Resources Menu | Blog, FAQ, Careers (and Events, from Level 11) |
| Footer Company Menu | About Us, Contact Us |
| Footer Legal Menu | Privacy Policy, Terms of Use (external links) |

## 5. Brand

| Token (CSS variable) | Value |
| --- | --- |
| Brand primary, Clarity teal (`--color-brand-primary`) | `#1D8C8C`; darker `#177272`, `#135D5D`; lighter `#64AFAF`, `#D0E7E7`, `#F5FAFA` |
| Brand secondary, Clarity gold (`--color-brand-secondary`) | `#D79839`; darker `#C18933`; lighter `#F7EBD9`, `#FDFBF7` |
| Neutrals (`--color-neutral-0` to `--color-neutral-10`) | 0 `#FFFFFF` (white), 1 `#F8F8F8` (page background), 2 `#DCDFDF`, 3 `#A6ACAC`, 4 `#A6ACAC`, 5 `#8B9393`, 6 `#707A7A`, 7 `#556161`, 8 `#3A4747` (body text), 9 `#1F2E2E`, 10 `#041515` (headings) |
| Font (all text) | Poppins (Google Fonts), 400 and 600 |
| Corner radius | `0.5rem` on cards (`--card-border-radius`), pill on buttons (`--btn-border-radius: 50rem`) |

The style book's quick brand check (Level 5) uses `#187373`, a shade of the primary teal.

Logos are in `context-source/assets/branding/`; the favicon is `clarity-favicon.svg` there.

## 6. Content

All sample content lives in `context-source/` (see `context-source/README.md`). The site's editorial content lives in **Liferay CMS Spaces**, not in Classic Web Content:

| Space | Holds | Structures |
| --- | --- | --- |
| Marketing | Articles, FAQs, announcements, leadership profiles, marketing images | Article, FAQ, Announcement, Leadership Profile |
| Branding | Logos and brand images | (files) |
| HR | Job listings and their images | Job Listing |
| Events | Events and event images | Event Information, Event Image |
| Products | Product images used by the catalog | (files) |

### Taxonomy

| Vocabulary | Categories | Used on |
| --- | --- | --- |
| FAQ | Retail Partners, Products and Services, Pricing and Ordering, Returns and Exchanges | FAQ entries |
| Articles | Innovation, Industry, Style | Articles |
| Clarity Products | Eyeglasses, Sunglasses, Contacts, Lenses | Products |
| Region / Location / Job Positions | See `context-source/data/job-taxonomy.csv` | Job listings |

## 7. Commerce

A **Clarity Eyewear** catalog with specifications (Frame Material, Frame Color, Frame Size in a *Frame Description* group), sold through a **Clarity Public** channel (site type B2B) linked to the public site. Products are in `context-source/data/products.csv`. The website shows products but doesn't take orders: product pages link to **Contact Us**.

## 8. Requirements (summary)

| ID | Requirement | Built in |
| --- | --- | --- |
| R1 | Personas, user groups, roles and least-privilege permissions | Level 1 |
| R2 | Public site with its own address, languages and accessibility | Level 2 |
| R3 | Page hierarchy, master pages, display pages and navigation | Level 3 |
| R4 | Reusable Clarity fragments and page compositions | Level 4 |
| R5 | Clarity's brand applied without editing each page | Level 5 |
| R6 | Editorial content in CMS Spaces, shared across sites | Level 6 |
| R7 | Pages that show content from collections, not hard-coded copies | Level 7 |
| R8 | Product catalog browsable by category | Level 8 |
| R9 | Legacy content and data imported through APIs | Level 9 |
| R10 | New content, including site-wide announcements, approved before it goes live | Level 10 |
| R11 | Job search and event listings driven by search | Level 11 |
| R12 | Contact Us form, follow-up workflow and an internal dashboard | Level 12 |
| R13 | A Home page tailored to signed-in distributors | Level 13 |
