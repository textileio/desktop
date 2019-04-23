package pages

import (
	"fmt"
	"os/exec"
	"path/filepath"
)

func postUpdateScript(hash string) error {
	cmd := exec.Command("sh", filepath.Join(scriptsDir, "pages-post-script-v0.sh"), hash)
	out, err := cmd.Output()
	if err != nil {
		fmt.Printf("\n%s", out)
		return err
	}
	fmt.Printf("\n%s", out)
	return nil
}