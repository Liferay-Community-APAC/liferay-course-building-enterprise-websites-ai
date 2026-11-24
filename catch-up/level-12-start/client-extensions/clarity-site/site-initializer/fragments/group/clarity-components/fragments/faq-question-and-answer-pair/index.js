(function () {
	const toggle = fragmentElement.querySelector('.clarity-faq__toggle');
	const answer = fragmentElement.querySelector('.clarity-faq__answer');

	if (!toggle || !answer) {
		return;
	}

	if (document.body.classList.contains('has-edit-mode-menu')) {
		toggle.setAttribute('aria-expanded', 'true');
		answer.hidden = false;

		return;
	}

	toggle.addEventListener('click', function () {
		const expanded = toggle.getAttribute('aria-expanded') === 'true';

		toggle.setAttribute('aria-expanded', String(!expanded));
		answer.hidden = expanded;
	});
})();
