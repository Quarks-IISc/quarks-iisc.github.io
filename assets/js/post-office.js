(function () {
  /**
   * SUBMIT FORM
   * Drag-and-drop, file validation and required-field checks for /post-office/.
   *
   * The form itself is a plain POST to the mail relay, so this script is a
   * convenience layer only: if it fails to load, the browser's own `required`
   * handling still stops an empty submission. Nothing here is a security
   * control — the relay is the thing that decides what it accepts.
   */

  var MAX_BYTES = 5 * 1024 * 1024; // relay caps a submission at 10 MB; leave 5 MB of headroom
  var ALLOWED = [
    'pdf', 'jpg', 'jpeg', 'png', 'webp', 'gif',
    'md', 'markdown', 'txt', 'rtf', 'doc', 'docx', 'odt'
  ];

  // Rough icon by family, so the chip reads at a glance.
  var ICONS = {
    pdf: 'fa-file-pdf',
    jpg: 'fa-file-image', jpeg: 'fa-file-image', png: 'fa-file-image',
    webp: 'fa-file-image', gif: 'fa-file-image',
    doc: 'fa-file-word', docx: 'fa-file-word', odt: 'fa-file-word',
    md: 'fa-file-alt', markdown: 'fa-file-alt', txt: 'fa-file-alt', rtf: 'fa-file-alt'
  };

  var form = document.getElementById('quarks-submit-form');
  if (!form) return;

  var fileInput = document.getElementById('piece-file');
  var dropzone = document.getElementById('dropzone');
  var chip = document.getElementById('file-chip');
  var chipIcon = document.getElementById('fc-icon');
  var chipName = document.getElementById('fc-name');
  var chipSize = document.getElementById('fc-size');
  var chipClear = document.getElementById('fc-clear');
  var titleInput = document.getElementById('piece-title');
  var nameInput = document.getElementById('sender-name');
  var emailInput = document.getElementById('sender-email');
  var placeInput = document.getElementById('sender-place');
  var subjectInput = document.getElementById('mail-subject');
  var ccInput = document.getElementById('mail-cc');
  var button = document.getElementById('submit-btn');

  var dialog = document.getElementById('po-confirm');
  var recapTitle = document.getElementById('po-recap-title');
  var recapSender = document.getElementById('po-recap-sender');
  var yesBtn = document.getElementById('po-yes');
  var noBtn = document.getElementById('po-no');

  var errTitle = document.getElementById('err-title');
  var errFile = document.getElementById('err-file');
  var errName = document.getElementById('err-name');
  var errEmail = document.getElementById('err-email');
  var errPlace = document.getElementById('err-place');

  // Deliberately strict about the shape rather than clever about the spec: one
  // @, a dot-separated domain, no spaces, no leading or trailing dots, and a
  // real TLD. A typo'd address is worse than none here, because it is the only
  // way back to whoever sent the piece.
  var EMAIL_RE = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;

  // "About you" is all or nothing: a name with no way to reach the sender is
  // a byline we can't check, so the three fields stand or fall together.
  var ABOUT = [
    { input: nameInput, error: errName },
    { input: emailInput, error: errEmail },
    { input: placeInput, error: errPlace }
  ];

  function aboutFilled() {
    return ABOUT.filter(function (f) {
      return f.input.value.trim() !== '';
    });
  }

  function ext(name) {
    var i = name.lastIndexOf('.');
    return i === -1 ? '' : name.slice(i + 1).toLowerCase();
  }

  function humanSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function showError(el, message) {
    if (message) el.textContent = message;
    el.classList.add('is-shown');
  }

  function clearError(el) {
    el.classList.remove('is-shown');
  }

  function clearFile() {
    fileInput.value = '';
    chip.classList.remove('is-shown');
    dropzone.classList.remove('has-error');
    clearError(errFile);
  }

  // Returns true when the picked file is one we can actually send.
  function acceptFile() {
    var file = fileInput.files && fileInput.files[0];
    if (!file) {
      chip.classList.remove('is-shown');
      return false;
    }

    var extension = ext(file.name);

    if (ALLOWED.indexOf(extension) === -1) {
      dropzone.classList.add('has-error');
      showError(
        errFile,
        'We can’t take .' + (extension || 'that') +
        ' files. Try PDF, an image, or plain text / Markdown.'
      );
      clearFileKeepError();
      return false;
    }

    if (file.size > MAX_BYTES) {
      dropzone.classList.add('has-error');
      showError(
        errFile,
        'That file is ' + humanSize(file.size) +
        ' — the limit is 5 MB. Compress it, or send a link in the remarks instead.'
      );
      clearFileKeepError();
      return false;
    }

    chipIcon.className = 'fas ' + (ICONS[extension] || 'fa-file-alt') + ' fc-icon';
    chipName.textContent = file.name;
    chipSize.textContent = humanSize(file.size);
    chip.classList.add('is-shown');
    dropzone.classList.remove('has-error');
    clearError(errFile);
    return true;
  }

  // Drop the rejected file but leave the message explaining why on screen.
  function clearFileKeepError() {
    fileInput.value = '';
    chip.classList.remove('is-shown');
  }

  fileInput.addEventListener('change', acceptFile);

  chipClear.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    clearFile();
  });

  // Drag and drop. The file input covers the dropzone, so the drop lands on it
  // natively in most browsers; assigning DataTransfer.files keeps the rest
  // consistent and gives us the validation pass either way.
  ['dragenter', 'dragover'].forEach(function (type) {
    dropzone.addEventListener(type, function (e) {
      e.preventDefault();
      dropzone.classList.add('is-hover');
    });
  });

  ['dragleave', 'drop'].forEach(function (type) {
    dropzone.addEventListener(type, function () {
      dropzone.classList.remove('is-hover');
    });
  });

  dropzone.addEventListener('drop', function (e) {
    e.preventDefault();
    var dropped = e.dataTransfer && e.dataTransfer.files;
    if (!dropped || !dropped.length) return;
    try {
      var transfer = new DataTransfer();
      transfer.items.add(dropped[0]);
      fileInput.files = transfer.files;
    } catch (err) {
      return; // older browser: the click-to-choose path still works
    }
    acceptFile();
  });

  form.addEventListener('submit', function (e) {
    var ok = true;

    if (!titleInput.value.trim()) {
      showError(errTitle);
      ok = false;
    } else {
      clearError(errTitle);
    }

    if (!fileInput.files || !fileInput.files.length) {
      dropzone.classList.add('has-error');
      showError(errFile, 'Attach a file — that’s the one thing we can’t do without.');
      ok = false;
    } else if (!acceptFile()) {
      ok = false;
    }

    // All three "about you" fields, or none of them. Leaving the block empty is
    // the anonymous path and passes untouched.
    var filled = aboutFilled();
    ABOUT.forEach(function (f) {
      if (filled.length > 0 && !f.input.value.trim()) {
        showError(f.error);
        ok = false;
      } else if (f.error !== errEmail) {
        clearError(f.error);
      }
    });

    var email = emailInput.value.trim();
    if (email && !EMAIL_RE.test(email)) {
      showError(errEmail, 'That email doesn\u2019t look right \u2014 check it, or clear this section.');
      ok = false;
    } else if (email) {
      clearError(errEmail);
    }

    if (!ok) {
      e.preventDefault();
      var firstError = form.querySelector('.field-error.is-shown');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Everything checks out, but nothing is sent yet: show what is about to go,
    // and let the dialog do the actual posting.
    e.preventDefault();
    openDialog();
  });

  // --- confirm before posting ---------------------------------------------

  function escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function openDialog() {
    var file = fileInput.files[0];

    recapTitle.innerHTML =
      escapeHtml(titleInput.value.trim()) +
      '<span class="po-sub">' + escapeHtml(file.name) +
      ' &middot; ' + humanSize(file.size) + '</span>';

    // The one thing worth being sure about: whether a name is going with it.
    if (aboutFilled().length === 0) {
      recapSender.innerHTML =
        'Anonymously<span class="po-sub">No name, email or institute is ' +
        'attached &mdash; we will have no way to reach you.</span>';
    } else {
      recapSender.innerHTML =
        escapeHtml(nameInput.value.trim()) +
        '<span class="po-sub">' + escapeHtml(emailInput.value.trim()) +
        ' &middot; ' + escapeHtml(placeInput.value.trim()) +
        '<br />Your name will be published with the piece.</span>';
    }

    dialog.classList.add('is-open');
    yesBtn.focus();
  }

  function closeDialog() {
    dialog.classList.remove('is-open');
    button.focus();
  }

  noBtn.addEventListener('click', closeDialog);

  // Clicking the backdrop, but not the card, is a "not yet" too.
  dialog.addEventListener('click', function (e) {
    if (e.target === dialog) closeDialog();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && dialog.classList.contains('is-open')) closeDialog();
  });

  yesBtn.addEventListener('click', function () {
    // Name the email after the piece so the inbox is readable.
    subjectInput.value = 'Quarks submission: ' + titleInput.value.trim().slice(0, 100);

    // Always copy the institute inbox; add the sender so they hold a record of
    // exactly what reached us. On the anonymous path only the first survives.
    var cc = ['quarks.ug@iisc.ac.in'];
    var senderEmail = emailInput.value.trim();
    if (senderEmail) cc.push(senderEmail);
    ccInput.value = cc.join(',');

    yesBtn.disabled = true;
    noBtn.disabled = true;
    yesBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Posting…';
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Sending…';

    // form.submit() bypasses the submit handler, which is what we want here —
    // validation has already run and the hidden fields are set.
    form.submit();
  });

  // Typing clears the complaint about the thing you're fixing.
  titleInput.addEventListener('input', function () {
    if (titleInput.value.trim()) clearError(errTitle);
  });
  // Typing anywhere in "about you" clears the whole block's complaints: the
  // three are one decision, so fixing one usually means filling the others.
  ABOUT.forEach(function (f) {
    f.input.addEventListener('input', function () {
      ABOUT.forEach(function (other) {
        clearError(other.error);
      });
    });
  });
})();
