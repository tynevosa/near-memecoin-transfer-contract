#!/bin/bash

# Initialize variables
a_flag=""
c_flag=""
f_flag=""
i_flag=""

# Parse arguments
while getopts "a:c:f:i:" opt; do
  case ${opt} in
    a)
      a_flag=${OPTARG}
      ;;
    c)
      c_flag=${OPTARG}
      ;;
    f)
      f_flag=${OPTARG}
      ;;
    i)
      i_flag=${OPTARG}
      ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      exit 1
      ;;
  esac
done

# Check required arguments
if [[ -z "$a_flag" || -z "$c_flag" || -z "$f_flag" || -z "$i_flag" ]]; then
  echo "Usage: $0 -a <value> -c <value> -f <value> -i <input_file>"
  exit 1
fi

echo "a_flag: $a_flag"
echo "c_flag: $c_flag"
echo "f_flag: $f_flag"
echo "i_flag: $i_flag"

# Process input file
input_var="["
if [ -n "$i_flag" ]; then
  if [ -f "$i_flag" ]; then
    while IFS= read -r line || [ -n "$line" ]; do
      input_var+="'$line',"
    done < "$i_flag"
    
    input_var="${input_var%,}]"
  else
    echo "Input file $i_flag not found."
    exit 1
  fi
fi

near call $c_flag $f_flag \"$input_var\" --accountId $a_flag
