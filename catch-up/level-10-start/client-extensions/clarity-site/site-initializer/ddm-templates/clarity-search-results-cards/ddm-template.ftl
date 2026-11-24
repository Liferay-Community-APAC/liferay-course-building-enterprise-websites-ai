<#--
	Clarity Search Results Cards: product image, name, category names and the frame-material
	specification as a badge. Category names and specification values come from
	headless-commerce-delivery-catalog through restClient (reachable as Guest; the channel comes from
	COMMERCE_CONTEXT). cpContentHelper.getCPDefinitionSpecificationOptionValues returned nothing here.
-->
<#assign
	commerceContext = renderRequest.getAttribute("COMMERCE_CONTEXT")
	channelId = commerceContext.getCommerceChannelId()
/>

<#if entries?has_content>
	<style>
		.clarity-product-card {
			background-color: var(--color-neutral-0, #fff);
			border: 1px solid var(--color-neutral-2, #e7e7ed);
			border-radius: var(--card-border-radius, 0.75rem);
			display: flex;
			flex-direction: column;
			height: 100%;
			overflow: hidden;
		}

		.clarity-product-card__image {
			aspect-ratio: 4 / 3;
			object-fit: cover;
			width: 100%;
		}

		.clarity-product-card__body {
			padding: var(--spacer-3, 1rem);
		}

		.clarity-product-card__categories {
			color: var(--color-neutral-6, #6b6c7e);
			font-size: 0.875rem;
			margin-bottom: 0.25rem;
		}

		.clarity-product-card__name {
			font-size: 1.125rem;
			margin-bottom: 0.5rem;
		}
	</style>

	<div class="clarity-product-cards row">
		<#list entries as cpCatalogEntry>
			<#assign
				cpDefinitionId = cpCatalogEntry.getCPDefinitionId()
				friendlyURL = cpContentHelper.getFriendlyURL(cpCatalogEntry, themeDisplay)
				imageURL = cpContentHelper.getDefaultImageFileURL(-1, cpDefinitionId)!""
				categoryNames = []
				frameMaterial = ""
			/>

			<#attempt>
				<#assign product = restClient.get("/headless-commerce-delivery-catalog/v1.0/channels/" + channelId + "/products/" + cpCatalogEntry.getCProductId() + "?nestedFields=categories,productSpecifications") />

				<#if product.categories??>
					<#list product.categories as category>
						<#assign categoryNames = categoryNames + [category.name] />
					</#list>
				</#if>

				<#if product.productSpecifications??>
					<#list product.productSpecifications as productSpecification>
						<#if productSpecification.specificationKey == "frame-material">
							<#assign frameMaterial = productSpecification.value!"" />
						</#if>
					</#list>
				</#if>
			<#recover>
			</#attempt>

			<div class="col-12 col-md-6 col-lg-4 mb-4">
				<article class="clarity-product-card">
					<a href="${htmlUtil.escapeHREF(friendlyURL)}">
						<img alt="${htmlUtil.escapeAttribute(cpCatalogEntry.getName())}" class="clarity-product-card__image" src="${htmlUtil.escapeAttribute(imageURL)}" />
					</a>

					<div class="clarity-product-card__body">
						<#if categoryNames?has_content>
							<p class="clarity-product-card__categories">${htmlUtil.escape(categoryNames?join(", "))}</p>
						</#if>

						<h3 class="clarity-product-card__name">
							<a href="${htmlUtil.escapeHREF(friendlyURL)}">${htmlUtil.escape(cpCatalogEntry.getName())}</a>
						</h3>

						<#if frameMaterial?has_content>
							<span class="badge badge-primary clarity-product-card__badge">${htmlUtil.escape(frameMaterial)}</span>
						</#if>
					</div>
				</article>
			</div>
		</#list>
	</div>
<#else>
	<div class="alert alert-info">
		<@liferay_ui["message"] key="no-products-were-found" />
	</div>
</#if>
