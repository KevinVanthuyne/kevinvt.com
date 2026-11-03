(function () {
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Letters are wrapped and hidden up front, so fitty and the layout size for the full text.
  function wrapCharacters(element) {
    var walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    var textNodes = [];
    var chars = [];
    while (walker.nextNode()) {
      if (walker.currentNode.textContent.trim()) {
        textNodes.push(walker.currentNode);
      }
    }
    textNodes.forEach((node) => {
      var fragment = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) {
          return;
        }
        if (/^\s+$/.test(part)) {
          fragment.appendChild(document.createTextNode(part));
          return;
        }
        part.split("").forEach((char) => {
          var span = document.createElement("span");
          span.className = "typed-char";
          span.textContent = char;
          fragment.appendChild(span);
          chars.push(span);
        });
      });
      node.parentNode.replaceChild(fragment, node);
    });
    return chars;
  }

  function typeOut(chars, options) {
    var typedCount = 0;
    function typeNext() {
      if (typedCount > 0) {
        chars[typedCount - 1].classList.remove("typing-cursor");
      }
      var char = chars[typedCount];
      char.classList.add("typed");
      typedCount++;
      // The last character gets no caret: headings end on their own blinking _, the subtitle just stops.
      if (typedCount < chars.length) {
        char.classList.add("typing-cursor");
        setTimeout(typeNext, options.interval || 60);
      } else if (options.onDone) {
        options.onDone();
      }
    }
    setTimeout(typeNext, options.delay || 0);
  }

  function typeSubtitle() {
    var subtitle = document.querySelector(".subtitle");
    if (subtitle) {
      typeOut(wrapCharacters(subtitle), { delay: 700 });
    }
  }

  function typeHeadingsOnScroll() {
    var headingChars = new Map();
    var observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            observer.unobserve(entry.target);
            typeOut(headingChars.get(entry.target), {});
          }
        });
      },
      { rootMargin: "0px 0px -15% 0px" }
    );
    document.querySelectorAll("main h2").forEach((heading) => {
      headingChars.set(heading, wrapCharacters(heading));
      observer.observe(heading);
    });
  }

  function cdCommandFor(url) {
    var project = url.pathname.match(/\/projects\/([^/]+)\.html$/);
    if (project) {
      return "cd ~/projects/" + project[1];
    }
    return url.hash === "#projects" ? "cd ~/projects" : "cd ~";
  }

  function typeCdBeforeLeaving() {
    var leaving = false;
    document.addEventListener("click", (event) => {
      var link = event.target.closest("a");
      if (
        leaving ||
        !link ||
        link.target ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      var url = new URL(link.href, window.location.href);
      var isOtherPage =
        url.protocol === window.location.protocol &&
        url.host === window.location.host &&
        url.pathname !== window.location.pathname &&
        /(\.html|\/)$/.test(url.pathname);
      if (!isOtherPage) {
        return;
      }

      event.preventDefault();
      leaving = true;
      var overlay = document.createElement("div");
      overlay.className = "cd-overlay";
      overlay.innerHTML =
        '<p class="cd-command"><span class="secondary-color">$</span> <span class="cd-text"></span></p>';
      var text = overlay.querySelector(".cd-text");
      text.textContent = cdCommandFor(url);
      document.body.appendChild(overlay);

      // Fetch the next page while the command is typed, so it opens without a second wait.
      var prefetch = document.createElement("link");
      prefetch.rel = "prefetch";
      prefetch.href = url.href;
      document.head.appendChild(prefetch);

      typeOut(wrapCharacters(text), {
        delay: 150,
        interval: 30,
        onDone: () =>
          setTimeout(() => {
            window.location.assign(url.href);
            // A stopped or failed navigation would otherwise leave the overlay blocking the page.
            setTimeout(removeOverlay, 3000);
          }, 250),
      });
    });

    function removeOverlay() {
      leaving = false;
      document.querySelectorAll(".cd-overlay").forEach((overlay) => overlay.remove());
    }

    // The back button can restore this page from the browser cache with the overlay still on top.
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) {
        removeOverlay();
      }
    });
  }

  function markActiveSection() {
    var links = document.querySelectorAll(".navbar a, .navbar-mobile a");
    var navList = document.querySelector(".navbar ul");
    if (!navList) {
      return;
    }
    var hashes = Array.from(navList.querySelectorAll("a"), (link) => link.hash).reverse();
    // #about sits on the portrait, so measure the whole section around each anchor.
    var sections = hashes.map((hash) => document.querySelector(hash).closest("section"));
    var marker = document.createElement("span");
    marker.className = "nav-marker secondary-color";
    marker.textContent = ">";
    navList.appendChild(marker);

    var shownActive = null;

    function update(force) {
      var readingLine = window.innerHeight * 0.4;
      var atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      var active = hashes[0];
      sections.forEach((section, index) => {
        if (section.getBoundingClientRect().top <= readingLine) {
          active = hashes[index];
        }
      });
      if (atBottom) {
        active = hashes[hashes.length - 1];
      }
      if (active === shownActive && !force) {
        return;
      }
      shownActive = active;
      links.forEach((link) => link.classList.toggle("active", link.hash === active));

      var activeLink = navList.querySelector("a.active");
      var x = activeLink.offsetLeft - marker.offsetWidth * 1.5;
      marker.style.transform = "translate(" + x + "px, " + activeLink.offsetTop + "px)";
    }

    var scheduled = false;
    function scheduleUpdate(force) {
      if (!scheduled) {
        scheduled = true;
        window.requestAnimationFrame(() => {
          scheduled = false;
          update(force);
        });
      }
    }

    update();
    // Web fonts change the link widths, so the marker is placed again once they have loaded.
    // Only moves after that are animated, not the first placement.
    document.fonts.ready.then(() => {
      update(true);
      window.requestAnimationFrame(() => marker.classList.add("ready"));
    });
    window.addEventListener("scroll", () => scheduleUpdate(false), { passive: true });
    window.addEventListener("resize", () => scheduleUpdate(true));
  }

  function showLastCommit() {
    var log = document.querySelector(".git-log");
    if (!log) {
      return;
    }
    fetch("https://api.github.com/repos/KevinVanthuyne/kevinvt.com/commits?sha=master&per_page=10")
      .then((response) => {
        if (!response.ok) {
          throw new Error(response.status);
        }
        return response.json();
      })
      .then((commits) => {
        var commit = commits.find((candidate) => candidate.parents.length === 1);
        if (!commit) {
          return;
        }
        var hash = log.querySelector(".git-log-hash");
        hash.textContent = commit.sha.slice(0, 7);
        hash.href = commit.html_url;
        log.querySelector(".git-log-date").textContent = new Date(
          commit.commit.author.date
        ).toDateString();
        log.querySelector(".git-log-message").textContent = commit.commit.message.split("\n")[0];
        log.hidden = false;
      })
      .catch(() => {});
  }

  markActiveSection();
  showLastCommit();

  if (reduceMotion) {
    return;
  }
  typeSubtitle();
  typeHeadingsOnScroll();
  typeCdBeforeLeaving();
})();
