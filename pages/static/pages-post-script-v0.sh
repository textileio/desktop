#!/usr/bin/env bash
set -e # abort on any error

HASH=${1?param missing - hash.}

if [[ -z "${PAGES_CLOUDFLARE_API_KEY}" ]]; then
    echo "See setup instructions to set PAGES_CLOUDFLARE_API_KEY"
    exit 1
fi

if [[ -z "${PAGES_CLOUDFLARE_EMAIL}" ]]; then
    echo "See setup instructions to set PAGES_CLOUDFLARE_EMAIL"
    exit 1
fi

if [ -z "$PAGES_DOMAIN_NAME" ]; then
    echo "See setup instructions to set PAGES_DOMAIN_NAME"
    exit 1
fi

if [ -z "$PAGES_IPFS_RECORD" ]; then
    echo "See setup instructions to set PAGES_IPFS_RECORD"
    exit 1
fi

# Curl the Cloudlfare endpoint for the zone Ids of the provided domains
response=$(curl -H "X-Auth-Key: $PAGES_CLOUDFLARE_API_KEY" \
        -H "X-Auth-Email: $PAGES_CLOUDFLARE_EMAIL" \
        -H "Content-Type: application/json" \
        -s "https://api.cloudflare.com/client/v4/zones?name=$PAGES_DOMAIN_NAME")

# Parse the json response to create an array if Ids: {df738f0220Xcda8842bdff65be572c24}
zoneIds=$(jq -r  '.result[].id' <<< "${response}" ) 

echo "Pages Update: ZoneId Found"

for zoneId in "${zoneIds[@]}"
do
    # Get the DNS record for the IPFS page
    response=$(curl -H "X-Auth-Key: $PAGES_CLOUDFLARE_API_KEY" \
            -H "X-Auth-Email: $PAGES_CLOUDFLARE_EMAIL" \
            -H "Content-Type: application/json" \
            -s "https://api.cloudflare.com/client/v4/zones/$zoneId/dns_records?name=_dnslink.$PAGES_IPFS_RECORD")

    recordIds=$(jq -r  '.result[].id' <<< "${response}" ) 

    if [ ${#recordIds[@]} -eq 0 ]; then
        echo "Pages Update: No record found. Follow Cloudflare setup instructions to add an initial IPFS record for $PAGES_IPFS_RECORD"
    else
        echo "Pages Update: DNS Record Found"
        for recordId in "${recordIds[@]}"
        do
       
            putResponse=$(curl -H "X-Auth-Key: $PAGES_CLOUDFLARE_API_KEY" \
                    -H "X-Auth-Email: $PAGES_CLOUDFLARE_EMAIL" \
                    -H "Content-Type: application/json" \
                    -X PUT \
                    --data "{\"type\":\"TXT\",\"name\":\"_dnslink.$PAGES_IPFS_RECORD\",\"content\":\"dnslink=/ipfs/$HASH\"}" \
                    -s "https://api.cloudflare.com/client/v4/zones/$zoneId/dns_records/$recordId")

            echo "Pages Update: Success"
            echo "  Webpage $PAGES_IPFS_RECORD updated to $HASH."
            echo "  Update time will vary depending on your Cloudflare settings."
            echo "  View latest page at https://cloudflare-ipfs.com/ipns/$PAGES_IPFS_RECORD."
        done
    fi

done