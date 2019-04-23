package pages

import (
	crypto "github.com/libp2p/go-libp2p-crypto"
	"github.com/textileio/go-textile/core"
	"path/filepath"
)

var (
	accountAddress     string
	appNode            *core.Textile
	pagesDir           string
	pagesNameKey       = "pagesKeyName-abcde"
	pagesPublishIPNS   = false
	pagesThread        = "Account Pages"
	pagesThreadId      string
	pagesThreadKey     = "pages_393320e3-9625-4830-b165-a3883edcb7c5"
	pagesThreadPrivKey crypto.PrivKey
	pagesUpdateThread  = false
	repoPath           string
	scriptsDir         string
	updateMethod       appUpdatesFn
	latestHash         string
)

type appUpdatesFn func(data interface{})

type updateMessage struct {
	appId   string
	appName string
	link    string
}

// Start the Pages app with repo monitoring
func Start(address string, repoPth string, node *core.Textile, appUpdateMethod appUpdatesFn) {
	accountAddress = address
	appNode = node
	repoPath = repoPth
	pagesDir = filepath.Join(repoPath, "pages")
	scriptsDir = filepath.Join(repoPath, "scripts")
	updateMethod = appUpdateMethod
	initApp()
	initPagesThread()
	startMonitor()
}

func updateTextile(newHash string) {
	latestHash = newHash

	objmap := map[string]interface{}{
		"appId":   "pages.textile.io",
		"appName": "Pages",
		"hash":    newHash,
	}
	updateMethod(objmap)
}
