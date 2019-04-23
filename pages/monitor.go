package pages

import (
	"fmt"
	"github.com/radovskyb/watcher"
	"log"
	"regexp"
	"time"
)

func newWatcher() {

	// Run an initial thread insert if required
	if pagesUpdateThread == true {
		updateThread()
		pagesUpdateThread = false
	}

	w := watcher.New()
	// ignore hidden files
	w.IgnoreHiddenFiles(true)

	r := regexp.MustCompile("index.html$")
	w.AddFilterHook(watcher.RegexFilterHook(r, false))

	// If SetMaxEvents is not set, the default is to send all events.
	w.SetMaxEvents(1)

	go func() {
		for {
			select {
			case _ = <-w.Event:
				if err := updateThread(); err != nil {
					fmt.Print(err)
				}
			case err := <-w.Error:
				fmt.Print(err)
			case <-w.Closed:
				return
			}
		}
	}()

	// Watch test_folder recursively for changes.
	if err := w.AddRecursive(pagesDir); err != nil {
		fmt.Print(err)
	}

	fmt.Println()

	// Trigger 2 events after watcher started.
	go func() {
		w.Wait()
		w.TriggerEvent(watcher.Create, nil)
	}()

	// Start the watching process - it'll check for changes every 100ms.
	if err := w.Start(time.Millisecond * 100); err != nil {
		log.Fatalln(err)
	}
}

func startMonitor() {
	go newWatcher()
}
