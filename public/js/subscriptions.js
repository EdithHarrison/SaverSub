document.addEventListener('DOMContentLoaded', function() {
    const rows = document.querySelectorAll('.subscription-row');
    rows.forEach(row => {
        row.addEventListener('click', function() {
            const id = row.dataset.id;
            toggleCompanyUrl(id);
        });
    });

    const paymentRangeSlider = document.getElementById('paymentRange');
    const paymentRangeLabel = document.getElementById('paymentRangeLabel');

    paymentRangeSlider.addEventListener('input', function() {
        paymentRangeLabel.textContent = paymentRangeSlider.value;
    });
});

function toggleCompanyUrl(id) {
    const urlElement = document.getElementById('company-url-' + id);
    if (urlElement.style.display === 'none' || urlElement.style.display === '') {
        urlElement.style.display = 'table-row';
    } else {
        urlElement.style.display = 'none';
    }
}
