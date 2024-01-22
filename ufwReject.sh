#!/bin/bash

if [ "$EUID" -ne 0 ]; then
  echo "Please run this script as root or sudo"
  exit 1
fi

# Store the IP addresses in a file
IP_ADDRESSES_STORE="ips.txt"

# Scan the kernel log for IP addresses and store them in a file
dmesg | grep 'SRC=' | awk -F'SRC=' '{ print $2 }' | awk '{ print $1 }' | sort | uniq | head -n 5000 > "$IP_ADDRESSES_STORE"

# Initialize a counter for new IPs
new_ips=0

# Store the output of ufw status in a variable
ufw_status=$(ufw status)

# Populate the UFW reject rule with the IP addresses collected from the kernel log
while IFS= read -r ip
do
  ip_prefix="${ip%.*}"
  # Check if the IP is already in the UFW rules
  if ! echo "$ufw_status" | grep -q "$ip" && [ "$ip_prefix" != "${TOAST_IP%.*}" ]
  then
    ufw reject from $ip
    # Increment the counter
    ((new_ips++))
  fi
done < "$IP_ADDRESSES_STORE"

echo "Done populating UFW reject rule"
echo "$new_ips IP addresses were added"
exit 0
