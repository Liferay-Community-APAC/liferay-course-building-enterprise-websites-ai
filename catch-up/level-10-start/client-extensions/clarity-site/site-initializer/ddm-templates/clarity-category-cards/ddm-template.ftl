<#--
	Clarity Category Cards: a bento grid of the vocabulary's categories.
	Card images come from the widget's preferences (categoryImage_<category ERC>), written by
	scripts/setup_category_cards.py from the Marketing Space files, because a template can't
	read CMS files at render time (Guest gets 403 from /o/cms).
-->
<#assign
	cardOrder = ["Eyeglasses", "Sunglasses", "Contacts", "Lenses"]
	cardWidths = [8, 4, 4, 8]
	preferences = renderRequest.getPreferences()
/>

<#if entries?has_content>
	<style>
		.clarity-category-cards .clarity-category-card {
			background-color: var(--color-neutral-1, #f4f5f7);
			background-position: center;
			background-size: cover;
			border-radius: var(--card-border-radius, 0.75rem);
			display: flex;
			flex-direction: column;
			justify-content: flex-end;
			min-height: 320px;
			overflow: hidden;
			position: relative;
		}

		.clarity-category-cards .clarity-category-card::before {
			background: linear-gradient(180deg, rgba(0, 0, 0, 0) 30%, rgba(0, 0, 0, 0.7) 100%);
			content: "";
			inset: 0;
			position: absolute;
		}

		.clarity-category-cards .clarity-category-card__body {
			color: var(--color-neutral-0, #fff);
			padding: var(--spacer-4, 1.5rem);
			position: relative;
		}

		.clarity-category-cards .clarity-category-card__title {
			color: inherit;
			margin-bottom: 0.5rem;
		}

		.clarity-category-cards .clarity-category-card__description {
			margin-bottom: 1rem;
		}
	</style>

	<div class="clarity-category-cards row">
		<#list cardOrder as cardName>
			<#list entries as category>
				<#if category.getName() == cardName>
					<#assign
						categoryURL = cpAssetCategoriesNavigationDisplayContext.getFriendlyURL(category.getCategoryId(), themeDisplay)
						imageURL = preferences.getValue("categoryImage_" + category.getExternalReferenceCode(), "")
					/>

					<div class="col-12 col-md-${cardWidths[cardName?index]} mb-4">
						<article
							class="clarity-category-card"
							<#if imageURL?has_content>style="background-image: url('${imageURL}');"</#if>
						>
							<div class="clarity-category-card__body">
								<h3 class="clarity-category-card__title">${htmlUtil.escape(category.getTitle(locale))}</h3>

								<p class="clarity-category-card__description">${htmlUtil.escape(category.getDescription(locale))}</p>

								<a class="btn btn-primary" href="${categoryURL}">Explore</a>
							</div>
						</article>
					</div>
				</#if>
			</#list>
		</#list>
	</div>
</#if>
