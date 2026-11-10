// Navbar "Student Hub" link.
//   Microsoft session exists -> go to the hub (the hub page then asks Supabase).
//   No session               -> start the Microsoft login; it returns to the hub.
// MSAL is only downloaded when the link is clicked.
(function () {
  var link = document.getElementById("student-hub-link");
  if (!link) return;

  link.addEventListener("click", function (event) {
    // Leave ctrl/cmd/middle-click (open in new tab) alone: the hub page
    // checks the session itself.
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    if (link.getAttribute("aria-busy") === "true") return;
    link.setAttribute("aria-busy", "true");

    import(link.getAttribute("data-auth-module"))
      .then(function (auth) {
        return auth.getMicrosoftIdToken().then(function (idToken) {
          if (idToken) {
            window.location.href = link.href;
          } else {
            return auth.startMicrosoftLogin();
          }
        });
      })
      .catch(function (err) {
        // Sign-in code couldn't load. Go to the hub anyway: it fails closed
        // and sends the visitor back to the home page.
        console.error("Student Hub: sign-in unavailable", err);
        window.location.href = link.href;
      });
  });
})();
