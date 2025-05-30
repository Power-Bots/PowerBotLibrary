export const BOLD_RED_FOREGROUND = "\x1b[1;31m";
export const BOLD_BLUE_FOREGROUND = "\x1b[1;34m";
export const BOLD_YELLOW_FOREGROUND = "\x1b[1;93m";
export const RESET_STYLE = "\x1b[0m";

export class Log {
    info(...message:any) {
        console.log(`${BOLD_BLUE_FOREGROUND}[INFO]${RESET_STYLE}`, ...message);
    };
    error(...message:any){
        console.error(`${BOLD_RED_FOREGROUND}[ERROR]${RESET_STYLE}`, ...message);
    };
    warn(...message:any){
        console.error(`${BOLD_YELLOW_FOREGROUND}[WARNING]${RESET_STYLE}`, ...message);
    };
};