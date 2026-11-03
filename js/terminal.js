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
    document.querySelectorAll("main:not(.project-page) h2").forEach((heading) => {
      headingChars.set(heading, wrapCharacters(heading));
      observer.observe(heading);
    });
  }

  // On a project page the cd line types first, as the command that opened the page, and the heading follows as its output.
  function typeProjectCommand() {
    var command = document.querySelector(".project-page .command");
    if (!command) {
      return;
    }
    var commandChars = wrapCharacters(command);
    commandChars.shift().classList.add("typed");
    var headingChars = wrapCharacters(command.nextElementSibling);
    typeOut(commandChars, {
      delay: 300,
      interval: 40,
      onDone: () => typeOut(headingChars, { delay: 300 }),
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
      var y = activeLink.offsetTop + (activeLink.offsetHeight - marker.offsetHeight) / 2;
      marker.style.transform = "translate(" + x + "px, " + y + "px)";
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

  function showScrollProgress() {
    var cells = 20;
    var progress = document.createElement("p");
    progress.className = "scroll-progress hidden-xs";
    progress.innerHTML =
      '[<span class="secondary-color"></span><span class="scroll-progress-rest"></span>] <span class="scroll-progress-percent"></span>';
    var filled = progress.children[0];
    var rest = progress.children[1];
    var percentText = progress.children[2];
    document.body.appendChild(progress);

    var shownPercent = null;
    function update() {
      var scrollable = document.documentElement.scrollHeight - window.innerHeight;
      progress.hidden = scrollable <= 0;
      var percent = scrollable > 0 ? Math.min(100, Math.round((window.scrollY / scrollable) * 100)) : 0;
      if (percent === shownPercent) {
        return;
      }
      shownPercent = percent;
      var filledCells = Math.round((percent / 100) * cells);
      filled.textContent = "#".repeat(filledCells);
      rest.textContent = "-".repeat(cells - filledCells);
      percentText.textContent = String(percent).padStart(3) + "%";
    }

    var scheduled = false;
    function scheduleUpdate() {
      if (!scheduled) {
        scheduled = true;
        window.requestAnimationFrame(() => {
          scheduled = false;
          update();
        });
      }
    }

    update();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    // Lazy-loaded images change the page height after load.
    window.addEventListener("load", scheduleUpdate);
  }

  markActiveSection();
  showScrollProgress();

  if (reduceMotion) {
    return;
  }
  typeSubtitle();
  typeHeadingsOnScroll();
  typeProjectCommand();
})();
