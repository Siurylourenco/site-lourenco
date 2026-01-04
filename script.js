/* ==========================================
   Script Geral: validação, máscara, reveal,
   lazy-load, counters, back-to-top, nav highlight
   ========================================== */

document.addEventListener("DOMContentLoaded", () => {
  // --- Ano automático no footer ---
  const yearSpan = document.getElementById("year");
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();


(function(){
  // espera DOM se necessário
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function(){
    const btn = document.getElementById('menu-toggle');
    const nav = document.getElementById('mobile-nav');
    const body = document.body;
    if (!btn || !nav) {
      console.warn('menu-toggle ou mobile-nav não encontrados:', btn, nav);
      return;
    }

    // evita múltiplas ligações
    if (btn.__menuBound) return;
    btn.__menuBound = true;

    function setState(open) {
      const willOpen = typeof open === 'boolean' ? open : !nav.classList.contains('open');
      nav.classList.toggle('open', willOpen);
      btn.classList.toggle('open', willOpen);
      btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      nav.setAttribute('aria-hidden', willOpen ? 'false' : 'true');
      document.body.classList.toggle('menu-open', willOpen);
    }

    function toggleHandler(e) {
      // evita dupla ação em touch/click
      if (e.type === 'touchstart') e.preventDefault();
      setState();
    }

    function linkHandler(e) {
      if (e.target && e.target.tagName && e.target.tagName.toLowerCase() === 'a') {
        setState(false);
      }
    }

    function outsideHandler(e) {
      if (!nav.classList.contains('open')) return;
      if (!nav.contains(e.target) && !btn.contains(e.target)) {
        setState(false);
      }
    }

    function escHandler(e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) setState(false);
    }

    btn.addEventListener('click', toggleHandler);
    btn.addEventListener('touchstart', toggleHandler, {passive:false});
    nav.addEventListener('click', linkHandler);
    document.addEventListener('click', outsideHandler);
    document.addEventListener('touchstart', outsideHandler, {passive:true});
    document.addEventListener('keydown', escHandler);

    // garante estado correto ao carregar
    btn.setAttribute('aria-expanded', nav.classList.contains('open') ? 'true' : 'false');
    nav.setAttribute('aria-hidden', nav.classList.contains('open') ? 'false' : 'true');

    console.log('Menu mobile: listeners anexados.');
  });
})();
  // --- AOS init (if present) ---
  if (window.AOS)
    AOS.init({ once: true, duration: 700, easing: "ease-out-quart" });

  // --- Back to top button (created dynamically) ---
  const backToTop = document.createElement("button");
  backToTop.className = "back-to-top";
  backToTop.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 15l6-6 6 6" stroke="#140300" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  document.body.appendChild(backToTop);
  backToTop.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" })
  );

  // show/hide back-to-top
  const toggleBackToTop = () => {
    if (window.scrollY > 400) backToTop.classList.add("show");
    else backToTop.classList.remove("show");
  };
  toggleBackToTop();
  window.addEventListener("scroll", toggleBackToTop, { passive: true });

  // --- IntersectionObserver: reveal elements & lazy data-src ---
  const prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ioOptions = {
    root: null,
    rootMargin: "0px 0px -10% 0px",
    threshold: 0.12,
  };
  if (prefersReduced) {
    // Respect user preference: reveal all immediately and load any data-src images
    document
      .querySelectorAll(".reveal")
      .forEach((el) => el.classList.add("revealed"));
    document.querySelectorAll("img[data-src]").forEach((img) => {
      if (img.dataset && img.dataset.src) img.src = img.dataset.src;
    });
  } else {
    const revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          // if image with data-src inside, lazy-load
          if (
            entry.target.tagName === "IMG" &&
            entry.target.dataset &&
            entry.target.dataset.src
          ) {
            entry.target.src = entry.target.dataset.src;
          }
          obs.unobserve(entry.target);
        }
      });
    }, ioOptions);

    document
      .querySelectorAll(".reveal, img[data-src]")
      .forEach((el) => revealObserver.observe(el));
  }

  // --- Animated counters (if present) ---
  const runCounter = (el, target) => {
    const duration = 1600;
    const start = performance.now();
    const initial = Number(el.textContent.replace(/[^0-9.-]+/g, "")) || 0;
    const diff = target - initial;
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      el.textContent = Math.round(initial + diff * t).toLocaleString("pt-BR");
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const counterObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target =
            Number(
              el.dataset.target ||
                el.getAttribute("data-target") ||
                el.textContent.replace(/[^0-9]/g, "")
            ) || 0;
          runCounter(el, target);
          obs.unobserve(el);
        }
      });
    },
    { threshold: 0.6 }
  );
  document
    .querySelectorAll(".counter")
    .forEach((el) => counterObserver.observe(el));

  // --- Nav highlight by section ---
  const navLinks = Array.from(
    document.querySelectorAll(
      '.nav-desktop a[href^="#"], .nav-mobile a[href^="#"]'
    )
  );
  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);
  if (sections.length) {
    const sectObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.id;
          const link = navLinks.find(
            (a) => a.getAttribute("href") === "#" + id
          );
          if (link) link.classList.toggle("active", entry.isIntersecting);
        });
      },
      { threshold: 0.5 }
    );
    sections.forEach((s) => sectObserver.observe(s));
  }

  // --- FAQ accordion (initialize on load, not on form submit) ---
  (function initFAQ() {
    try {
      const faqButtons = Array.from(document.querySelectorAll(".faq-btn"));
      console.debug("[FAQ] found buttons:", faqButtons.length);
      if (faqButtons.length === 0) return;

      faqButtons.forEach((btn) => {
        try {
          btn.setAttribute("role", "button");
          btn.setAttribute("tabindex", "0");
          const parent = btn.closest(".faq-item");
          if (parent && parent.classList.contains("active"))
            btn.setAttribute("aria-expanded", "true");
          else btn.setAttribute("aria-expanded", "false");

          const toggle = () => {
            const item = btn.closest(".faq-item");
            if (!item) return;
            const isActive = item.classList.contains("active");

            // close other items (one open at a time)
            document.querySelectorAll(".faq-item.active").forEach((i) => {
              if (i !== item) {
                i.classList.remove("active");
                const b = i.querySelector(".faq-btn");
                if (b) b.setAttribute("aria-expanded", "false");
              }
            });

            if (isActive) {
              item.classList.remove("active");
              btn.setAttribute("aria-expanded", "false");
            } else {
              item.classList.add("active");
              btn.setAttribute("aria-expanded", "true");
            }
          };

          btn.addEventListener("click", toggle);
          btn.addEventListener("keydown", (ev) => {
            if (ev.key === "Enter" || ev.key === " ") {
              ev.preventDefault();
              toggle();
            }
          });
        } catch (innerErr) {
          console.error("[FAQ] button handler error for", btn, innerErr);
        }
      });
    } catch (err) {
      console.error("[FAQ] initialization error", err);
    }
  })();

  // --- Phone mask helper (Brazilian style) ---
  const phoneInput = document.querySelector(
    'input[name="telefone"], input#telefone'
  );
  if (phoneInput) {
    const onlyDigits = (v) => v.replace(/\D/g, "");
    phoneInput.addEventListener("input", (e) => {
      const v = onlyDigits(e.target.value);
      let out = v;
      if (v.length > 11) out = v.slice(0, 11);
      if (out.length <= 2) out = out;
      else if (out.length <= 6) out = `(${out.slice(0, 2)}) ${out.slice(2)}`;
      else if (out.length <= 10)
        out = `(${out.slice(0, 2)}) ${out.slice(2, 6)}-${out.slice(6)}`;
      else
        out = `+${out.slice(0, 2)} (${out.slice(2, 4)}) ${out.slice(
          4,
          9
        )}-${out.slice(9, 13)}`;
      e.target.value = out;
    });
  }

  // --- Form handling with validation and visual feedback ---
  const form = document.getElementById("contactForm");
  const status = document.getElementById("statusMsg");
  const ENDPOINT_URL = "https://formspree.io/f/xeoykgwq";

  const emailValid = (v) => /\S+@\S+\.\S+/.test(v);

  if (form) {
    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      if (!status) return;
      status.classList.remove("error", "success");
      status.textContent = "";

      const nome = ((form.nome && form.nome.value) || "").trim();
      const telefone = ((form.telefone && form.telefone.value) || "").trim();
      const email = ((form.email && form.email.value) || "").trim();

      // reset input error styles
      form
        .querySelectorAll(".input-error")
        .forEach((i) => i.classList.remove("input-error"));

      if (!nome) {
        status.textContent = "Por favor, informe seu nome.";
        status.classList.add("error");
        form.nome && form.nome.classList.add("input-error");
        return;
      }

      if (!email && !telefone) {
        status.textContent =
          "Informe e-mail ou telefone para podermos responder.";
        status.classList.add("error");
        if (form.email) form.email.classList.add("input-error");
        if (form.telefone) form.telefone.classList.add("input-error");
        return;
      }

      if (email && !emailValid(email)) {
        status.textContent = "E-mail inválido. Verifique o formato.";
        status.classList.add("error");
        form.email && form.email.classList.add("input-error");
        return;
      }

      // show loading
      status.textContent = "Enviando...";

      try {
        const data = {
          nome: nome,
          telefone: telefone,
          email: email,
          empresa: ((form.empresa && form.empresa.value) || "").trim(),
          instagram: ((form.instagram && form.instagram.value) || "").trim(),
          mensagem: ((form.mensagem && form.mensagem.value) || "").trim(),
        };

        const res = await fetch(ENDPOINT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (res.ok) {
          status.textContent = "Enviado com sucesso — obrigado!";
          status.classList.add("success");
          form.reset();
          // redirect optionally to obrigado.html after short delay
          setTimeout(() => {
            if (location.pathname.indexOf("obrigado") === -1)
              location.href = "obrigado.html";
          }, 1300);
        } else {
          status.textContent =
            "Erro ao enviar. Tente novamente ou use o WhatsApp.";
          status.classList.add("error");
          console.error("Form send error", res.status);
        }
      } catch (err) {
        status.textContent = "Falha na conexão. Verifique sua rede.";
        status.classList.add("error");
        console.error(err);
      }
    });
  }
});
