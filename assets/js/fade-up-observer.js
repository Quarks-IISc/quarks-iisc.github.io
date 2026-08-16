// Reveals any .fade-up-element once it scrolls into view.
document.addEventListener("DOMContentLoaded", function () {
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                }
            });
        },
        { threshold: 0.1 },
    );

    document.querySelectorAll(".fade-up-element").forEach((el) => {
        observer.observe(el);
    });
});
