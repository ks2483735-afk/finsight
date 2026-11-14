module.exports = {
  version: "7.0",
  title: "FinSight",
  description: "Open-source, local-first finance research for market data, company context, and news. Bring your own provider keys; demo fallback data stays clearly labeled.",
  menu: async (kernel, info) => {
    const installed = info.exists("node_modules");
    const running = {
      install: info.running("install.js"),
      start: info.running("start.js"),
      update: info.running("update.js"),
      reset: info.running("reset.js")
    };
    const links = [{
      icon: "fa-solid fa-arrow-up-right-from-square",
      text: "Web preview",
      href: "https://finsight-psi-gold.vercel.app"
    }, {
      icon: "fa-brands fa-github",
      text: "Repository",
      href: "https://github.com/ks2483735-afk/finsight"
    }];

    if (running.install) {
      return [{
        default: true,
        icon: "fa-solid fa-plug",
        text: "Installing",
        href: "install.js"
      }, ...links];
    }

    if (installed) {
      if (running.start) {
        const local = info.local("start.js");
        if (local && local.url) {
          return [{
            default: true,
            icon: "fa-solid fa-rocket",
            text: "Open FinSight",
            href: local.url
          }, {
            icon: "fa-solid fa-terminal",
            text: "Terminal",
            href: "start.js"
          }, ...links];
        }
      }

      return [{
        default: true,
        icon: "fa-solid fa-power-off",
        text: "Start",
        href: "start.js"
      }, {
        icon: "fa-solid fa-rotate",
        text: "Update",
        href: "update.js"
      }, {
        icon: "fa-solid fa-plug",
        text: "Reinstall",
        href: "install.js"
      }, {
        icon: "fa-regular fa-circle-xmark",
        text: "Reset",
        href: "reset.js"
      }, ...links];
    }

    if (running.update) {
      return [{
        default: true,
        icon: "fa-solid fa-terminal",
        text: "Updating",
        href: "update.js"
      }, ...links];
    }

    if (running.reset) {
      return [{
        default: true,
        icon: "fa-solid fa-terminal",
        text: "Resetting",
        href: "reset.js"
      }, ...links];
    }

    return [{
      default: true,
      icon: "fa-solid fa-plug",
      text: "Install",
      href: "install.js"
    }, ...links];
  }
};
