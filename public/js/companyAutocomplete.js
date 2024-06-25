document.addEventListener('DOMContentLoaded', function () {
    const companyInput = document.getElementById('company');
    const suggestionsBox = document.getElementById('company-suggestions');
    const companyUrlInput = document.getElementById('companyUrl');

    companyInput.addEventListener('focus', function () {
        suggestionsBox.style.display = 'block';
    });

    companyInput.addEventListener('blur', function () {
        setTimeout(() => { // Delay to allow click event to register
            suggestionsBox.style.display = 'none';
        }, 200);
    });

    companyInput.addEventListener('input', function () {
        const query = this.value.toLowerCase();
        const items = Array.from(suggestionsBox.children);
        items.forEach(item => {
            if (item.dataset.name.toLowerCase().includes(query)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    });

    suggestionsBox.addEventListener('click', function (event) {
        const selectedItem = event.target.closest('.suggestion-item');
        if (selectedItem) {
            companyInput.value = selectedItem.dataset.name;
            companyUrlInput.value = selectedItem.dataset.url;
        }
    });
});
