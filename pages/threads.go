package pages

import (
	"crypto/rand"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	ipld "github.com/ipfs/go-ipld-format"
	ipfspath "github.com/ipfs/go-path"
	crypto "github.com/libp2p/go-libp2p-crypto"
	"github.com/textileio/go-textile/ipfs"
	"github.com/textileio/go-textile/pb"
	"github.com/textileio/go-textile/schema"
	"github.com/textileio/go-textile/util"
)

// Adds a single file to the app thread: pagesThreadId
func addFile(path string) (string, error) {
	fi, err := os.Stat(path)
	if err != nil {
		return "", err
	}
	// get the size
	size := fi.Size()
	if size > 262144 {
		return "", fmt.Errorf("Pages upload too large: %s", size)
	}
	thrd := appNode.Thread(pagesThreadId)
	if thrd == nil {
		return "", fmt.Errorf("Pages thread not found: %s", pagesThreadId)
	}

	if thrd.Schema == nil {
		return "", fmt.Errorf("Thread schema not found for: %s", pagesThreadId)
	}

	var use string
	if ref, err := ipfspath.ParsePath(path); err == nil {
		parts := strings.Split(ref.String(), "/")
		use = parts[len(parts)-1]
	}

	mdir := &pb.MobilePreparedFiles{
		Dir: &pb.Directory{
			Files: make(map[string]*pb.FileIndex),
		},
		Pin: make(map[string]string),
	}

	writeDir := repoPath + "/tmp/"

	mil, err := getMill(thrd.Schema.Mill, thrd.Schema.Opts)
	if err != nil {
		return "", err
	}

	conf, err := getFileConfigByPath(mil, path, use, thrd.Schema.Plaintext)
	if err != nil {
		return "", err
	}

	added, err := appNode.AddFileIndex(mil, *conf)
	if err != nil {
		return "", err
	}
	mdir.Dir.Files[schema.SingleFileTag] = added

	if added.Size >= int64(appNode.Config().Cafe.Client.Mobile.P2PWireLimit) {
		mdir.Pin[added.Hash] = writeDir + added.Hash
	}

	var node ipld.Node
	var keys *pb.Keys
	file := mdir.Dir.Files[schema.SingleFileTag]
	if file != nil {

		node, keys, err = appNode.AddNodeFromFiles([]*pb.FileIndex{file})
		if err != nil {
			return "", err
		}

	} else {

		rdir := &pb.Directory{Files: make(map[string]*pb.FileIndex)}
		for k, file := range mdir.Dir.Files {
			rdir.Files[k] = file
		}

		node, keys, err = appNode.AddNodeFromDirs(&pb.DirectoryList{Items: []*pb.Directory{rdir}})
		if err != nil {
			return "", err
		}
	}

	if node == nil {
		return "", errors.New("no files found")
	}

	_, err = thrd.AddFiles(node, "", keys.Files)
	if err != nil {
		return "", err
	}

	return added.Hash, nil
}

// Creates the app thread: pagesThreadId
func createThread() (string, crypto.PrivKey, error) {
	config := pb.AddThreadConfig{
		Name: pagesThread,
	}
	config.Key = pagesThreadKey

	config.Schema = &pb.AddThreadConfig_Schema{
		Json: "{\"name\": \"pages-index-schema-123\", \"pin\": true, \"plaintext\": true, \"mill\": \"/blob\"}",
	}

	config.Type = pb.Thread_READ_ONLY
	config.Sharing = pb.Thread_SHARED
	config.Whitelist = util.SplitString("", ",")

	// make a new secret
	sk, _, err := crypto.GenerateEd25519Key(rand.Reader)
	if err != nil {
		return "", sk, err
	}
	view, newerr := appNode.AddThread(config, sk, accountAddress, true, true)
	return view.Id, sk, newerr
}

// Create the app thread if it doesn't exist
func initPagesThread() error {
	if !pagesThreadExists() {
		id, sk, err := createThread()
		if err != nil {
			return err
		}
		if id != "" {
			pagesThreadId = id
			pagesThreadPrivKey = sk
			pagesUpdateThread = true
			return nil
		}

		return errors.New("Failed to create Pages thread")
	}
	return nil
}

// Checks that our Pages thread exists before any update attempts
func pagesThreadExists() bool {
	thrd := appNode.ThreadByKey(pagesThreadKey)
	if thrd != nil {
		pagesThreadId = thrd.Id
		pagesThreadPrivKey = thrd.PrivKey
		return true
	}
	return false
}

// Adds our thread sk to the IPFS keystore for use in IPNS pub
func setPrivateKey() error {
	node := appNode.Ipfs()
	return node.Repo.Keystore().Put(pagesNameKey, pagesThreadPrivKey)
}

// Insert latest index.html into our thread and update IPNS
func updateThread() error {
	filepath := filepath.Join(pagesDir, "index.html")
	if _, err := os.Stat(filepath); err != nil {
		return err
	}
	// path/to/whatever exists
	hash, err := addFile(filepath)
	if err != nil {
		return err
	}
	return publishPage(hash)
}

// Publishes latest Thread head to IPNS
func publishIPNS(hash string) error {
	setPrivateKey() // ensure our local guy has got it
	t := appNode.Ipfs()
	entry, err := ipfs.PublishIPNS(t, hash, pagesNameKey, time.Minute*5)
	if err != nil {
		return err
	}
	fmt.Printf("\nIPNS record updated: %s\n", entry.Name())
	return nil
}

// Publishes latest Thread head to IPNS
func publishPage(hash string) error {
	// Run any post update scripts
	postUpdateScript(hash)

	updateTextile(hash)

	// An IPNS update freebie
	if pagesPublishIPNS == true {
		publishIPNS(hash)
	}
	return nil
}
