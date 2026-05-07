#!/bin/bash
# Toggle caffeinate: keeps your Mac fully awake (display, idle, disk, system)
# while Claude works on the Sarah Science Chapters project.
# Double-click to start. Double-click again to stop.

if pgrep -x "caffeinate" > /dev/null; then
    killall caffeinate
    echo "Caffeinate stopped — your Mac can sleep normally again."
else
    caffeinate -dimsu &
    disown
    echo "Caffeinate started — your Mac will stay awake until you run this again."
fi

# Keep the Terminal window open briefly so you can see the message
sleep 2
