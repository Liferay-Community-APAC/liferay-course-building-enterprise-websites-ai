<#--
	Clarity Search Category: the category facet grouped by vocabulary (Region, Location,
	Job Positions, ...), one checkbox list per vocabulary. The default category facet display is a
	flat list of every category, so it can't show which vocabulary a term belongs to.
-->
<#assign vocabularyNames = assetCategoriesSearchFacetDisplayContext.getVocabularyNames()![] />

<div class="clarity-search-category">
	<#if !assetCategoriesSearchFacetDisplayContext.isNothingSelected()>
		<@clay.button
			cssClass="btn-unstyled c-mb-3 facet-clear-btn"
			displayType="link"
			id="${namespace + 'facetAssetCategoriesClear'}"
			onClick="Liferay.Search.FacetUtil.clearSelections(event);"
		>
			<strong>${languageUtil.get(locale, "clear")}</strong>
		</@clay.button>
	</#if>

	<#list vocabularyNames as vocabularyName>
		<#assign bucketDisplayContexts = assetCategoriesSearchFacetDisplayContext.getBucketDisplayContexts(vocabularyName)![] />

		<#if bucketDisplayContexts?has_content>
			<fieldset class="clarity-search-category__vocabulary c-mb-4">
				<legend class="clarity-search-category__vocabulary-name h5">${htmlUtil.escape(vocabularyName)}</legend>

				<ul class="list-unstyled">
					<#list bucketDisplayContexts as bucketDisplayContext>
						<li class="facet-value">
							<div class="custom-checkbox custom-control">
								<label>
									<@liferay_ui.csp>
										<input
											${bucketDisplayContext.isSelected()?then("checked", "")}
											class="custom-control-input facet-term"
											data-term-id="${bucketDisplayContext.getFilterValue()}"
											disabled
											onChange="Liferay.Search.FacetUtil.changeSelection(event);"
											type="checkbox"
										/>
									</@liferay_ui.csp>

									<span class="custom-control-label">
										<span class="custom-control-label-text">
											${htmlUtil.escape(bucketDisplayContext.getBucketText())}

											<#if bucketDisplayContext.isFrequencyVisible()>
												<small class="term-count">(${bucketDisplayContext.getFrequency()})</small>
											</#if>
										</span>
									</span>
								</label>
							</div>
						</li>
					</#list>
				</ul>
			</fieldset>
		</#if>
	</#list>
</div>
