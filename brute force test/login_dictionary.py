from selenium import webdriver
from selenium.webdriver.common.keys import Keys
import itertools
import os

def every_combination(n):
    generator=itertools.combinations_with_replacement('abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ!"#$%&\'()*+,-./:;<=>?@[\]^_`{|}~', n )
    return list(generator)
    
print("Please enter the username")
username_str=input()

while True:
    print("Please input the dictionary file name. eg:password.txt")
    n=input()
    try:
        f = open( r'./dictionary/{}'.format(n), 'r' )
        break
    except:
        print("File not found.")


options=webdriver.ChromeOptions()
options.binary_location="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
chrome_driver=r"C:\Users\x1301\Desktop\chromedriver.exe"
driver=webdriver.Chrome(chrome_driver,chrome_options=options)

driver.get("http://localhost:9998")
username=driver.find_element_by_id("username")
username.send_keys(username_str)


for line in f.readlines():
    line=line.replace('\n','')
    print(line)
    password=driver.find_element_by_id("password")
    password.send_keys(line)
    driver.find_element_by_class_name("submit").click()
    try:
        assert "menu-log-out" in driver.page_source
        print("Test failed, find password {} for the given username".format(each))
        break
    except:
        continue
print("Test has passed, did not find password.")

f.close()
