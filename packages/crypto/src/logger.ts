export const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  magenta: "\x1b[35m",
  red: "\x1b[31m",
  white: "\x1b[37m",
  blue: "\x1b[34m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m"
};

export const logBoxHeader = (title: string, sessionId: string, color: string) => {
  console.log(`\n${color}╔════════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${color}║ ${colors.bright}${colors.white}${title.padEnd(50)} ${colors.dim}ID: ${sessionId}${colors.reset} ${color}║${colors.reset}`);
  console.log(`${color}╠════════════════════════════════════════════════════════════════╣${colors.reset}`);
};

export const logBoxFooter = (color: string) => {
  console.log(`${color}╚════════════════════════════════════════════════════════════════╝${colors.reset}\n`);
};

export const logEntry = (label: string, value: string, icon: string = "◈") => {
  const cleanLabel = label.padEnd(18);
  console.log(`  ${colors.cyan}${icon} ${colors.white}${cleanLabel}${colors.reset} ${colors.dim}→${colors.reset} ${value}`);
};
