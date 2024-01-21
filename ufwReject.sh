#!/bin/bash

if [ "$EUID" -ne 0 ]; then
  echo "Please run this script as root or sudo"
  exit 1
fi

# Store the IP addresses in a file
IP_ADDRESSES_STORE="ips.txt"

# Scan the kernel log for IP addresses and store them in a file
dmesg | grep 'SRC=' | awk -F'SRC=' '{ print $2 }' | awk '{ print $1 }' | sort | uniq | head -n 5000 > "$IP_ADDRESSES_STORE"

# Populate the UFW reject rule with the IP addresses collected from the kernel log
while IFS= read -r ip
do
  # Check if the IP is already in the UFW rules
  if ! ufw status | grep -q "$ip"
  then
    ufw reject from $ip
  fi
done < "$IP_ADDRESSES_STORE"

echo "Done populating UFW reject rule"
exit 0
