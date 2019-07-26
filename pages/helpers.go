package pages

import (
	"errors"
	"io"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"

	"github.com/textileio/go-textile/core"
	"github.com/textileio/go-textile/mill"
	"github.com/textileio/go-textile/pb"
)

// Replica of the getMill method used in textile.mobile api
func getMill(id string, opts map[string]string) (mill.Mill, error) {
	switch id {
	case "/blob":
		return &mill.Blob{}, nil
	case "/image/resize":
		width := opts["width"]
		if width == "" {
			return nil, errors.New("missing width")
		}
		quality := opts["quality"]
		if quality == "" {
			quality = "75"
		}
		return &mill.ImageResize{
			Opts: mill.ImageResizeOpts{
				Width:   width,
				Quality: quality,
			},
		}, nil
	case "/image/exif":
		return &mill.ImageExif{}, nil
	case "/json":
		return &mill.Json{}, nil
	default:
		return nil, nil
	}
}

// Replica from textile.mobile api
func getFileConfigByPath(mil mill.Mill, path string, use string, plaintext bool) (*core.AddFileConfig, error) {
	var reader io.ReadSeeker
	conf := &core.AddFileConfig{}

	if use == "" {
		f, err := os.Open(path)
		if err != nil {
			return nil, err
		}
		defer f.Close()
		reader = f

		_, file := filepath.Split(f.Name())
		conf.Name = file

	} else {
		var file *pb.FileIndex
		var err error
		reader, file, err = appNode.FileContent(use)
		if err != nil {
			return nil, err
		}

		conf.Name = file.Name
		conf.Use = file.Checksum
	}

	var err error
	if mil.ID() == "/json" {
		conf.Media = "application/json"
	} else {
		conf.Media, err = appNode.GetMedia(reader)
		if err != nil {
			return nil, err
		}
	}
	reader.Seek(0, 0)

	input, err := ioutil.ReadAll(reader)
	if err != nil {
		return nil, err
	}
	conf.Input = input
	conf.Plaintext = plaintext

	return conf, nil
}

// pbValForEnumString returns the int value of a case-insensitive string representation of a pb enum
func pbValForEnumString(vals map[string]int32, str string) int32 {
	for v, i := range vals {
		if strings.ToLower(v) == strings.ToLower(str) {
			return i
		}
	}
	return 0
}

func writeFileData(hash string, pth string) error {
	if err := os.MkdirAll(filepath.Dir(pth), os.ModePerm); err != nil {
		return err
	}

	data, err := appNode.DataAtPath(hash)
	if err != nil {
		return err
	}

	return ioutil.WriteFile(pth, data, 0644)
}
