<?php
/**
 * this is just the first draft
 *
 * @package     Remote API
 * @license     yet unknown
 * @author      Lars Kneschke <l.kneschke@metaways.de>
 * @copyright   Copyright (c) 2008 Metaways Infosystems GmbH (http://www.metaways.de)
 * @version     $Id$
 */

var_dump($_POST);

require_once 'Zend/Loader.php';

Zend_Loader::registerAutoload();

$client = new TineClient_Connection($_POST['url']);

if($_POST['debug'] == 'yes') {
    $client->setDebugEnabled(true);
}


echo "Try to login...<br>";

$client->login($_POST['username'], $_POST['password']);


echo "<hr>Try to add contact...<br>";

$contactData = $_POST['contact'];
$contactData['owner'] = 5;

$contact = new Addressbook_Model_Contact($contactData);

$updatedContact = $client->addContact($contact);

var_dump($updatedContact->toArray());

echo "<hr>Try to logout...<br>";

$client->logout();

echo '<a href="index.html">Back to contact form</a>';