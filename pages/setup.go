package pages

import (
	"fmt"
	"github.com/gobuffalo/packr"
	"io/ioutil"
	"os"
	"path/filepath"
)

// Moves our index.html static file to the account Public folder
func addIndexTemplate() error {
	// init our pages directory with a stander index.html
	box := packr.NewBox("./static")
	data, err := box.FindString("index.html")
	if err != nil {
		return fmt.Errorf("error creating pages: %s", err)
	}
	if err := ioutil.WriteFile(filepath.Join(pagesDir, "index.html"), []byte(data), 0644); err != nil {
		return err
	}
	return nil
}

// Moves our pages-post-script-v0.sh to the account scripts folder
func addPublishScript() error {
	// init our pages directory with a stander index.html
	box := packr.NewBox("./static")
	data, err := box.FindString("pages-post-script-v0.sh")
	if err != nil {
		return fmt.Errorf("error creating post script: %s", err)
	}
	if err := ioutil.WriteFile(filepath.Join(scriptsDir, "pages-post-script-v0.sh"), []byte(data), 0744); err != nil {
		return err
	}
	return nil
}

// Creates the pagesDir on disk
func createAppDirs() error {
	// We need the ability to have a Pages folder per account.
	if err := os.MkdirAll(pagesDir, 0755); err != nil {
		return err
	}
	if err := os.MkdirAll(scriptsDir, 0755); err != nil {
		return err
	}
	return nil
}

// Returns true if our Pages directory exists for this account
func isInitialized() (bool, error) {
	_, err := os.Stat(pagesDir)
	if err == nil {
		return true, nil
	}
	if os.IsNotExist(err) {
		return false, nil
	}
	return true, err
}

// Creates Pages directory and seeds index.html
func initApp() error {

	if init, err := isInitialized(); init == false || err != nil {
		if err != nil {
			return err
		}

		if err := createAppDirs(); err != nil {
			return err
		}

		if err := addIndexTemplate(); err != nil {
			return err
		}

		if err := addPublishScript(); err != nil {
			return err
		}
	}
	return nil
}
