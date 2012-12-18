$(document).ready(function(){

//{{{ INICIO PLUGIN E-HELP ('Como navegar no índice')
	$.getJSON("../js/paths.json",
		function(paths) {
			$('.EHhelpBox').embeddedHelp(paths, {
			'animatedvp': true,
			'staticvp': true,
			'autoalign':false,
			'callextf':true,
		    'autolinks':false			
	     	});
		});
		
	$.ativaProximoDestaque = function(obj) { 
		proximo = obj.value;
		$.getJSON("../js/paths.json",
			function(paths) {
				$('#'+proximo).embeddedHelp(paths, {
				'animatedvp': true,
				'staticvp': true,
				'autoalign':false,
				'callextf':true,
				'autolinks':false		
				});
		});
		return false;
	}
	
	$.ativaFiltroEProximoDestaque = function(obj) { 
		proximo = obj.value;
		$.getJSON("../js/paths.json",
			function(paths) {
				$('#'+proximo).embeddedHelp(paths, {
				'animatedvp': true,
				'staticvp': true,
				'autoalign':false,
				'callextf':true,
				'autolinks':false		
				});
		});
		//digita texto no filtro
		$('.dataTables_filter:visible input').focus().val('ação');

		return false;
	}
	
	//simula filtro - evento 'keyup' na tecla enter
	$(document).on("mouseup","#EHhelpBox3 a",function(){
		var e = jQuery.Event("keyup");
		e.which = 13;
		e.keyCode = 13;
		$(".dataTables_filter input").trigger(e);
	});
	
	//termina help
	$(document).on("mouseup","#fecha_ehelp",function(){
		$('#EHtooltip').fadeOut("slow", $('#EHtooltip').remove());
		$('#EHpointer').fadeOut("slow", $('#EHpointer').remove());
		$('.EHmarker').removeClass('EHmarker');
	});
	/*$.terminaAjuda = function(obj) {
		$('#EHtooltip').fadeOut("slow", $('#EHtooltip').remove());
		$('#EHpointer').fadeOut("slow", $('#EHpointer').remove());
		$('.EHmarker').removeClass('EHmarker');
	}*/

	//FIM PLUGIN E-HELP }}}
	
	//{{{ INICIO MENSAGEM INICIAL
		// efeito máscara para mensagem de início do tutorial
	function inicioTutorial() {
		$("body").append("<div class='efeito_mascara_indice'></div>");
		$(".efeito_mascara_indice").css({opacity:0.7})
								   .fadeIn("fast");
		$(".texto_intro_tutorial").css("margin-top", ($(".texto_intro_tutorial").innerHeight() / 2) * -1)
								  .fadeIn("fast");
	}
	inicioTutorial();
	// função de clique no botão #inicia_tutorial da mensagem de início do tutorial (remove a mensagem) 
	// vale também para cliques na div .efeito_mascara_indice e tecla ESC
	$(document).on("click", "#inicia_tutorial, .efeito_mascara_indice", function(event) {
		$(".texto_intro_tutorial").fadeOut("fast", function(){ $(this).remove(); });
		$(".efeito_mascara_indice").fadeOut("fast", function(){ $(this).remove(); });	   
	});
	$(document).keypress(function(e) {
		if(e.keyCode == 27) {	
			$(".texto_intro_tutorial").fadeOut("fast", function(){ $(this).remove(); });
			$(".efeito_mascara_indice").fadeOut("fast", function(){ $(this).remove(); });
		}
	});
			
	// função de clique no botão #inicia_comonavegar da mensagem de início do tutorial (remove a mensagem e dispara o 'Como navegar') 	
	$(document).on("click", "#inicia_comonavegar", function(event) {
		$(this).parent().parent().fadeOut("fast", function(){ $(this).remove(); });
		$(".efeito_mascara_indice").fadeOut("fast", function(){ 
			$(this).remove(); 
			var e = jQuery.Event("click");
			$(".EHhelpBox a").trigger(e);
		});
	});
	
	// FIM MENSAGEM INICIAL}}}
	
	//{{{ INICIO PLUGIN DATATABLE
	// comportamento de tabelas	
	$("table").dataTable({
        "bPaginate": false,
        "bLengthChange": false,
        "bFilter": true,
        "bSort": false,
        "bInfo": false,
        "bAutoWidth": false
    } );
    
    	$(".dataTables_filter").prepend("<div class='filtrar_categoria'>Filtrar nesta categoria</div>");
	
	// esconde texto "filtrar nesta categoria" ao clicar no campo de busca da tabela
	$(document).on("click", ".filtrar_categoria", function(){
		$(this).hide();
		$(".dataTables_filter input").focus();
	});
	$(document).on("focus",".dataTables_filter input", function(){
		$(this).parent().siblings(".filtrar_categoria").hide();
	});
	$(document).on("blur",".dataTables_filter input", function(){
		if($(this).val() == "") {
			$(this).parent().siblings(".filtrar_categoria").show();
		}	
	});   
    
    
	// FIM PLUGIN DATATABLE}}}
	
});