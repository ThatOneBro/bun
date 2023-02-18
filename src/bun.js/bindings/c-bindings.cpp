// when we don't want to use @cInclude, we can just stick wrapper functions here
#include <sys/resource.h>
#include <cstdint>
#include <unistd.h>
#include <sys/fcntl.h>
#include <sys/stat.h>
#include <sys/signal.h>

#include "TTYHelper.h"

using namespace Zig;

extern "C" int32_t set_tty_orig_termios()
{
    return tty__get_termios(STDIN_FILENO, NULL);
}

extern "C" typedef tty_mode_t tty_mode_t;
extern "C" int32_t set_tty_mode(tty_mode_t mode)
{
    // ASSERT(mode == TTY_MODE_NORMAL || mode == TTY_MODE_RAW);
    if (mode < TTY_MODE_NORMAL || mode > TTY_MODE_RAW)
        return -1;
    return tty__set_mode(STDIN_FILENO, mode);
}

extern "C" int32_t get_process_priority(uint32_t pid)
{
    return getpriority(PRIO_PROCESS, pid);
}

extern "C" int32_t set_process_priority(uint32_t pid, int32_t priority)
{
    return setpriority(PRIO_PROCESS, pid, priority);
}

extern "C" bool is_executable_file(const char* path)
{

#if defined(O_EXEC)
    // O_EXEC is macOS specific
    int fd = open(path, O_EXEC | O_CLOEXEC, 0);
    if (fd < 0)
        return false;
    close(fd);
    return true;
#endif

    struct stat st;
    if (stat(path, &st) != 0)
        return false;

    // regular file and user can execute
    return S_ISREG(st.st_mode) && (st.st_mode & S_IXUSR);
}

extern "C" void bun_ignore_sigpipe()
{
    // ignore SIGPIPE
    signal(SIGPIPE, SIG_IGN);
}
extern "C" ssize_t bun_sysconf__SC_CLK_TCK()
{
#ifdef __APPLE__
    return sysconf(_SC_CLK_TCK);
#else
    return 0;
#endif
}